/* eslint-disable no-console */
/* eslint-disable no-shadow */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose'
import type { Model as ModelType } from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
// import nestore, { NST, NSTAdapterGenerator, NSTAdapter, NSTClass } from '../../../src/nestore' //~ DEV - import from npm 
import nestore, { NST, NSTAdapterGenerator, NSTAdapter, NSTClass } from 'nestore' //~ DEV - import from npm 
// import Nestore, { NestoreType, NestoreAdapter } from 'nestore'

// const createLog = (namespace:string) => debug(`nestore:mongo-adapter:${namespace}`)
const LOG = debug('nestore').extend('mongo-adapter')

type NestoreMongoAdapterConfig = {
    mongoUri: string
    collectionName?: string
    documentKey?: string
    // namespace?: string
    batchTime?: number
}

/*
Type '
<T>(config: NestoreMongoAdapterConfig) => NSTAdapter
' is not assignable to type '
NSTAdapterGenerator
'.
  Types of parameters 'config' and 'config' are incompatible.
    Property 'mongoUri' is missing in type '{ namespace: string; } & { [key: string]: unknown; [key: number]: unknown; }' but required in type 'NestoreMongoAdapterConfig'.ts(2322)
*/

const mongoAdapterGenerator: NSTAdapterGenerator = <T>(namespace: string, config: NestoreMongoAdapterConfig) => {
  const _log = LOG.extend('generator')
  
  _log('Parsing namespace and config...')

  if (!mongoose || !mongoose.connect || typeof mongoose.connect !== 'function') {
    throw new Error('nestore mongooseAdapter - Could not find package "mongoose"')
  }

  if( typeof namespace !== 'string' ){
    _log('Invalid namespace:', namespace)
    throw new Error('nestore-mongo-adapter error: Must provide valid namespace string.')
  }

  if( namespace.length < 4 ){
    _log(`Namespace too short. Minimum of 4 characters: ${namespace} (${namespace.length})`)
    throw new Error('nestore-mongo-adapter error: Must provide valid namespace string.')
  }

  if(
    !config 
    || typeof config !== 'object' 
    || Array.isArray(config) 
    || typeof config.mongoUri !== 'string' 
    || config.mongoUri.length < 10
  ){
    _log('bad config:', config)
    throw new Error('nestore-mongo-adapter error: Must provide valid config object with at least "mongoUri" connection string.')
  }

  

  _log('Namespace and config validated')



  const mongoAdapter:NSTAdapter = async <T>(nst: NSTClass<T>) => {

    const settings = {
      namespace,
      batchTime: config.batchTime ?? 2000,
      mongoUri: config.mongoUri,
      collectionName: config.collectionName ?? 'nestore-data',
      documentKey: config.documentKey ?? config.collectionName ?? 'nestore-data'
    }

    settings.mongoUri = config.mongoUri

    const ns = {
      registered: `@.${settings.namespace}.registered`, // => namespace
      error: `@.${settings.namespace}.error`, // => the error
      loading: `@.${settings.namespace}.loading`, // => store (before loaded)
      loaded: `@.${settings.namespace}.loaded`, // => store (after loaded)
      saving: `@.${settings.namespace}.saving`, // => store (being saved)
      saved: `@.${settings.namespace}.saved` // => store (what was saved)
    }

    try {
      let Model: ModelType<any> | null = null
      
      //&                                                                                 
      const handleLoad = async () => {
        const log = LOG.extend('load')
        if(mongoose?.connection?.readyState !== 1){
          log('Mongoose not ready...')
          return false
        }

        try {
          log('-'.repeat(60))
          log(`loading collection "${settings.collectionName}" - document "${settings.documentKey}"...`)
          nst.emit(ns.loading, nst.store)

          if(!Model){
            let err = 'Mongoose model not connected yet...'
            console.log(err)
            nst.emit(ns.error, err)
            return false
          }
          const result = await Model.findOne({ key: settings.documentKey })
          if (result && result.store) {
            log('loaded:', result.store)
            nst.set(result.store)
            nst.emit(ns.loaded, nst.store)
          } else {
            log('loaded: no data... skipping nst.set() - ', result)
            nst.emit(ns.loaded, nst.store)
          }
          return true
        } catch (err) {
          log('-'.repeat(60))
          log('Error loading data with middleware:', err)
          log('-'.repeat(60))
          nst.emit(ns.error, err)
          return false
        }
      }

      //&                                                                                 
      const handleSave = async () => {
        const log = LOG.extend('save')
        if(mongoose?.connection?.readyState !== 1){
          log('Mongoose not ready...')
          return false
        }
        
        try {
          // handleSave?.cancel && handleSave.cancel()
          const currentStore = nst.store
          log('-'.repeat(60))
          nst.emit(ns.saving, currentStore)
          log('Saving store:', currentStore)

          if(!Model){
            let err = 'Mongoose model not connected yet...'
            console.log(err)
            nst.emit(ns.error, err)
            return false
          }

          log(`Checking if document exists: "${settings.documentKey}"`)
          let result = await Model.findOne({ key: settings.documentKey })
          log('Result A:', result)

          if (!result) {
            log(`No document found... creating document: "${settings.documentKey}"`)
            result = await Model.create({
              key: settings.documentKey,
              store: currentStore
            })
            log('Result B:', result)
          } else {
            log('Document found... updating document')
            result = await Model.findOneAndUpdate({
              key: settings.documentKey
            }, {
              store: currentStore
            }, {
              new: false, overwrite: true
            })
            log('Result C:', result)
          }

          console.log('SAVED:', result?.store ?? {})

          // log('db after save:', result)
          nst.set(result?.store ?? {}, null, 'none') // has to be quiet to prevent infinite updates
          nst.emit(ns.saved, nst.store ?? {})
          log('Store saved')
          return true
        } catch (err) {
          nst.emit(ns.error, err)
          log('Error saving data with middleware')
          return false
        }
      }

      //&                                                                                 
      const throttledSave = throttle(handleSave, settings.batchTime, {
        leading: false,
        trailing: true
      })

      //&                                                                                 
      const handleDisconnect = async () => {
        await mongoose.disconnect()
      }

      //&                                                                                 
      // TODO- Wrap all function bodies in try/catch and use the outer try/catch for definition errors
      const onMongoConnect = () => {
        
        nst.emit(ns.registered, settings.namespace)
        
        const _log = LOG.extend('on-connect')
        _log('mongoose connected')

        const modelSchema = new mongoose.Schema({}, { strict: false })

        Model = mongoose.models[settings.collectionName] || mongoose.model(
          settings.collectionName,
          modelSchema,
          settings.collectionName
        )

        nst.onAny((data:any) => {
          if (!data.startsWith('@')){
            throttledSave()
          }
        })

        handleLoad()
      }
      

      //&                                                                                 
      _log('Mongoose connecting...')
      mongoose.set('strictQuery', false)
      await mongoose.connect(settings.mongoUri)
      // mongoose.connection.readyState
      mongoose.connection
      .on('error', (err:any) => {
        console.log('MONGOOSE ERROR:', err)
        _log('MONGOOSE ERROR', err)
      })
      .once('open', () => onMongoConnect())



      return { 
        namespace: settings.namespace,
        load: handleLoad, 
        save: handleSave,
        disconnect: handleDisconnect
      }

    } catch (err) {
      nst.emit(ns.error, err)
      throw new Error(`Nestore "${settings.namespace}" error:` + err)
    }
  }





  
  return mongoAdapter
}

export default mongoAdapterGenerator
