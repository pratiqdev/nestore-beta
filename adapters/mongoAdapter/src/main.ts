/* eslint-disable no-console */
/* eslint-disable no-shadow */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose'
import type { Model as ModelType } from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
import Nestore, { NST, NSTAdapterGenerator, NSTAdapter, NSTClass } from '../../../src/nestore' //~ DEV - import from npm 
// import Nestore, { NestoreType, NestoreAdapter } from 'nestore'

const createLog = (namespace:string) => debug(`nestore:mongo-adapter:${namespace}`)

type NestoreMongoAdapterConfig = {
    mongoUri: string
    collectionName?: string
    documentKey?: string
    namespace?: string
    batchTime?: number
}

/*
Call signature return types 
'<T>(nst: NSTClass<T>) => Promise<string | undefined>' 
'<T>(nst: NSTClass<T>) => Promise<string>' are incompatible.







Type 
'(config: NestoreMongoAdapterConfig) => <T>(nst: NSTClass<T>, callbacks: NSTAdapterGeneratorCallbacks) => Promise<string | undefined>' 

is not assignable to type 'NSTAdapterGenerator'.

Call signature return types 
'<T>(nst: NSTClass<T>, callbacks: NSTAdapterGeneratorCallbacks) => Promise<string | undefined>' and 
'NSTAdapter' 

are incompatible.
    
Type 
'Promise<string | undefined>' 
is not assignable to type 
'string | Promise<string> | undefined'.


      Type 'Promise<string | undefined>' is not assignable to type 'Promise<string>'.
        Type 'string | undefined' is not assignable to type 'string'.
          Type 'undefined' is not assignable to type 'string'.ts(2322)











*/

// const goodMemoize = (cb:any, ...args:any[]) => {

//   function md5blk(s) { /* I figured global was faster.   */
//     var md5blks = [], i; /* Andy King said do it this way. */
//     for (i=0; i<64; i+=4) {
//     md5blks[i>>2] = s.charCodeAt(i)
//     + (s.charCodeAt(i+1) << 8)
//     + (s.charCodeAt(i+2) << 16)
//     + (s.charCodeAt(i+3) << 24);
//     }
//     return md5blks;
//   }

// }


const mongoAdapterGenerator: NSTAdapterGenerator = <T>(config: NestoreMongoAdapterConfig) => {
  const log = createLog('mongo')
  log('Initializing...')

  const mongoAdapter:NSTAdapter = async <T>(nst: NSTClass<T>) => {

    const settings = {
      namespace: config.namespace ?? 'nestore-mongo-adapter',
      batchTime: config.batchTime ?? 2000,
      mongoUri: config.mongoUri ?? undefined,
      collectionName: config.collectionName ?? 'nestore-data',
      documentKey: config.documentKey ?? config.collectionName ?? 'nestore-data'
    }

    settings.mongoUri = config.mongoUri

    log('Namespace:', settings.namespace)
    log('Mongo URI:', settings.mongoUri) //~ DEV - remove 


    const ns = {
      registered: `@.${settings.namespace}.registered`, // => namespace
      error: `@.${settings.namespace}.error`, // => the error
      loading: `@.${settings.namespace}.loading`, // => store (before loaded)
      loaded: `@.${settings.namespace}.loaded`, // => store (after loaded)
      saving: `@.${settings.namespace}.saving`, // => store (being saved)
      saved: `@.${settings.namespace}.saved` // => store (what was saved)
    }



    try {
      
      
      if (!mongoose || !mongoose.connect || typeof mongoose.connect !== 'function') {
        const err = 'Could not find package "mongoose"'
        console.log(err)
        nst.emit(ns.error, err)
        throw new Error(err)
      }

      let Model: ModelType<any> | null = null
      
      //&                                                                                 
      const handleLoad = async () => {
        const log = createLog('mongo:load')
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
        try {
          // handleSave?.cancel && handleSave.cancel()
          const log = createLog('mongo:save')
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
          nst.set(result?.store ?? {}, null, 'quiet') // has to be quiet to prevent infinite updates
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
      const onMongoConnect = () => {
        
        nst.emit(ns.registered, settings.namespace)
        
        const _log = createLog('mongo:on-connect')
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
      

      log('Mongoose connecting...')
      mongoose.set('strictQuery', false)
      mongoose.connect(settings.mongoUri)
      mongoose.connection
      .once('open', onMongoConnect)
      .on('error', (err:any) => {
        console.log('MONGOOSE ERROR:', err)
        log('MONGOOSE ERROR', err)
      })

      const handleDisconnect = async () => {
        await mongoose.disconnect()
      }


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



  if(
    !config 
    || typeof config !== 'object' 
    || Array.isArray(config) 
    || typeof config.mongoUri !== 'string' 
    || config.mongoUri.length < 10
  ){
    throw new Error('nestore-mongo-adapter error: Must provide valid config object with at least "mongoUri" connection string.')
  }

  
  return mongoAdapter
}

export default mongoAdapterGenerator
