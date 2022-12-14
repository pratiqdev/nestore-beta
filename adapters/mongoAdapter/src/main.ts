/* eslint-disable no-console */
/* eslint-disable no-shadow */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
import mongoose from 'mongoose'
import type { Model as ModelType } from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
import Nestore, { TypeNestore, TypeNestoreAdapter, TypeNestoreAdapterCallbacks, TypeNestoreClass } from '../../../src/nestore' //~ DEV - import from npm 
// import Nestore, { NestoreType, NestoreAdapter } from 'nestore'

const createLog = (namespace:string) => debug(`nestore:mongo-adapter:${namespace}`)
debug.enable('nestore:mongo-adapter:**')

type NestoreMongoAdapterConfig = {
    mongoUri: string
    collectionName: string
    documentKey: string
    namespace:string
    batchTime:number
}

/*
Call signature return types 
'<T>(nst: TypeNestoreClass<T>) => Promise<string | undefined>' 
'<T>(nst: TypeNestoreClass<T>) => Promise<string>' are incompatible.







Type 
'(config: NestoreMongoAdapterConfig) => <T>(nst: TypeNestoreClass<T>, callbacks: TypeNestoreAdapterCallbacks) => Promise<string | undefined>' 

is not assignable to type 'TypeNestoreAdapter'.

Call signature return types 
'<T>(nst: TypeNestoreClass<T>, callbacks: TypeNestoreAdapterCallbacks) => Promise<string | undefined>' and 
'TypeNestoreAdapterReturn' 

are incompatible.
    
Type 
'Promise<string | undefined>' 
is not assignable to type 
'string | Promise<string> | undefined'.


      Type 'Promise<string | undefined>' is not assignable to type 'Promise<string>'.
        Type 'string | undefined' is not assignable to type 'string'.
          Type 'undefined' is not assignable to type 'string'.ts(2322)











*/


const mongoAdapter: TypeNestoreAdapter = (
  config: NestoreMongoAdapterConfig
) => async <T>(nst: TypeNestoreClass<T>) => {

  const log = createLog('mongo')
  log('Initializing...')

  const settings = {
    namespace: config.namespace ?? 'nestore-mongo-adapter',
    batchTime: config.batchTime ?? 2000,
    mongoUri: config.mongoUri ?? undefined,
    collectionName: config.collectionName ?? 'nestore-data',
    documentKey: config.documentKey ?? config.collectionName ?? 'nestore-data'
  }

  if (typeof config.mongoUri !== 'string' || config.mongoUri.length < 10) {
    console.log('nestore-mongo-adapter error: Must provide valid "mongoUri" mongodb connection string.')
    return
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
      const err = 'Could not import module "mongoose"'
      console.log(err)
      nst.emit(ns.error, err)
      return
    }
    
    let storeLoaded = false
    
    const onMongoConnect = () => {
      nst.emit(ns.registered, settings.namespace)
      const _log = createLog('mongo:on-connect')
      _log('mongoose connected')
      const modelSchema = new mongoose.Schema({}, { strict: false })
      const Model:ModelType<any> = mongoose.model(
        settings.collectionName,
        modelSchema,
        settings.collectionName
      )

      const loadStore = async () => {
        const log = createLog('mongo:load')
        try {
          if (storeLoaded) return
          log('-'.repeat(60))
          log(`loading collection "${settings.collectionName}" - document "${settings.documentKey}"...`)
          nst.emit(ns.loading, nst.store)

          const result = await Model.findOne({ key: settings.documentKey })
          if (result && result.store) {
            log('loaded:', result.store)
            nst.set(result.store)
            nst.emit(ns.loaded, nst.store)
          } else {
            log('loaded: no data... skipping nst.set() - ', result)
            nst.emit(ns.loaded, nst.store)
          }
          storeLoaded = true
        } catch (err) {
          log('-'.repeat(60))
          log('Error loading data with middleware:', err)
          log('-'.repeat(60))
          nst.emit(ns.error, err)
        }
      }

      // _
      const handleSaveFunc = async () => {
        try {
          // handleSave?.cancel && handleSave.cancel()
          const log = createLog('mongo:save')
          const currentStore = nst.store
          log('-'.repeat(60))
          nst.emit(ns.saving, currentStore)
          log('Saving store:', currentStore)

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

          // log('db after save:', result)
          nst.set(result?.store ?? {}, null, 'quiet')
          nst.emit(ns.saved, nst.store)
          log('Store saved')
        } catch (err) {
          log('-'.repeat(60))
          nst.emit(ns.error, err)
          log('Error saving data with middleware')
          log('-'.repeat(60))
        }
      }

      // _
      const handleSave = throttle(handleSaveFunc, settings.batchTime, {
        leading: false,
        trailing: true
      })

      // _
      nst.onAny((data:any) => {
        if (data.startsWith('@')) return
        handleSave()
      })

      loadStore()
    }

    log('Mongoose connecting...')
    mongoose.set('strictQuery', false)
    mongoose.connect(settings.mongoUri)
    mongoose.connection
    .once('open', onMongoConnect)
    .on('error', (err:any) => console.log('MONGOOSE ERROR:', err))

    nst.emit(ns.registered, settings.namespace)
    return 
  } catch (err) {
    log('-'.repeat(60))
    console.log(`Nestore "${settings.namespace}" error:`, err)
    nst.emit(ns.error, err)
    log('-'.repeat(60))
    return
  }

}

export default mongoAdapter
