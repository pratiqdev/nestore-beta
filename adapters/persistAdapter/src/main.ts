// import type { Model} from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
import Nestore, { TypeNestore, TypeNestoreAdapter, TypeNestoreClass } from '../../../src/nestore' //~ DEV ONLY
// import { NestoreAdapter, Nestore } from 'nestore'



//- TODO
//- convert arguments to strictly typed config object
//- convert namespaced events to object provided by nestore that include methods:
//  - adapter.register()

export type TypePersistAdapterConfig = {
  namespace?: string;
  storage?: Storage,
  storageKey: string;
  batchTime: number;
}

debug.enable('nestore:**')

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const persistAdapter: TypeNestoreAdapter = (
  config: TypePersistAdapterConfig
) => async <T>(nst: TypeNestoreClass<T>) => {
  
  const log = debug(`nestore`).extend('persist-adapter') 
  log('Adapter initializing...')

  
  // adapters are registered within the constructor of nestore
  // so they must wait for instantiation to complete (ee2 in this case)
  // to have access to class methods like 'emit'

  // let inst = await new Promise((res) => {
  //   let attempts = 0
  //   let delay = 1000
  //   let max_wait = 10_000
  //   let toRef:any = null

  //   const checkEmit = () => {
  //     toRef = setTimeout(() => {
  //       attempts++
  //       if(attempts > max_wait * delay){
  //         clearTimeout(toRef)
  //         res(false)
  //       }

  //       const didEmit = nst.emit('test_event_path', 'Test Value')
  //       console.log('didEmit:',didEmit)

  //       if(didEmit){
  //         clearTimeout(toRef)
  //         res(true)
  //       }

  //       checkEmit()
  //     }, delay);
  //   }
  
  //   checkEmit()
  // })

  // if(!inst){
  //   console.log('nestore-persist-adapter Error: Could not access instance of Nestore during registration')
  //   return
  // }

  

  const settings:any = {}

  if(!config || typeof config !== 'object' || !Object.keys(config).length){
    console.log('Nestore persistAdapter requires a config object with at least { "storageKey": <string> }')
    throw new Error('Nestore persistAdapter requires a config object with at least { "storageKey": <string> }')
  }

  if (typeof config.storage === 'undefined' || !config.storage) {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      log('No storage provided, using localStorage')
      settings.storage = window.localStorage
    } else {
      log('No storage provided, and localStorage not available')
      console.log('nestore-persist-adapter: No storage object provided and localStorage not available.')
      throw new Error('No storage provided, and localStorage not available')
    }
  }
  if (typeof config.storage?.getItem !== 'function' || typeof config.storage?.setItem !== 'function') {
    console.log('nestore-persist-adapter: Storage object must have (getItem, setItem) methods.')
    return
  }
  settings.storage = config.storage

  if (typeof config.storageKey === 'undefined' || !config.storageKey.length) {
    throw new Error('Local, session and indexedDB require a storage key')
  }
  settings.storageKey = config.storageKey

  if (typeof config.namespace !== 'string' || config.namespace.length < 3) {
    console.log('nestore-persist-adapter: No "namespace" provided, using "nestore-persist-adapter"')
    settings.namespace = 'nestore-persist-adapter'
  }else{
    settings.namespace = config.namespace
  }

  if (typeof config.batchTime !== 'number') {
    console.log('nestore-persist-adapter: No "batchTime" provided')
    return
  }
  settings.batchTime = config.batchTime




  const ns = {
    registered: `@.${settings.namespace}.registered`, // => namespace
    error: `@.${settings.namespace}.error`, // => the error
    loading: `@.${settings.namespace}.loading`, // => store (before loaded)
    loaded: `@.${settings.namespace}.loaded`, // => store (after loaded)
    saving: `@.${settings.namespace}.saving`, // => store (being saved)
    saved: `@.${settings.namespace}.saved` // => store (what was saved)
  }


  
  try {
    let storeLoaded = false
    let handleSave:any
    nst.emit(ns.registered, settings.namespace)

    
    //&                                                                                             
    const loadStore = async () => {
      const _log = log.extend('load')
      try {
        if (storeLoaded){
          _log('Store already loaded, preventing load from storage')
          return
        } 
        nst.emit(ns.loading, nst.store)
        
        let sto = {}
        try{
          _log('Loading storage into store...')
          let d = settings.storage?.getItem(settings.storageKey)
          _log('Storage loaded. Parsing data...')
          if(!d){
            _log('No data in storage')
            return
          }
          _log('Storage loaded. Parsing data...')
          d = JSON.parse(d)
          _log('Successfully parsed json-like data from storage')
          sto = d
        }catch(err){
          _log('Error parsing json-like object from storage:', err)
        }



        nst.set(sto)
        nst.emit(ns.loaded, sto)
        _log('Storage loaded into store:', sto)
        storeLoaded = true
      } catch (err) {
        _log('Error loading storage with persist adapter:', err)
        nst.emit(ns.error, err)
      }
    }

    //&                                                                                             
    const handleSaveFunc = () => {
      const _log = log.extend('save')
      try {
        _log('Saving store to storage...')
        nst.emit(ns.saving, nst.store)
        const currentNestoreStoreAsString = JSON.stringify(nst.store)

        settings.storage?.setItem(settings.storageKey, currentNestoreStoreAsString)
        const valueRetrievedFromMockStorageAfterSave = settings.storage?.getItem(settings.storageKey)

        if (valueRetrievedFromMockStorageAfterSave && valueRetrievedFromMockStorageAfterSave === currentNestoreStoreAsString) {
          _log('Store saved to storage')
          nst.emit(ns.saved, nst.store)
        } else {
          // const msg = 'Saved value does not match the current store after save was completed'
          _log('Persist adapter error:', {
            msg: 'The value (v) was saved to storage (s) but (s != v) after saving complete',
            s: valueRetrievedFromMockStorageAfterSave,
            v: currentNestoreStoreAsString
          })
          // nst.emit(ns.error, {
          //   msg: 'The value (v) was saved to storage (s) but (s != v) after saving complete',
          //   s: valueRetrievedFromMockStorageAfterSave,
          //   v: currentNestoreStoreAsString
          // })
        }
      } catch (err) {
        nst.emit(ns.error, err)
        _log('Persist adapter error:', err)
      }
    }

    //&                                                                                             
    handleSave = throttle(handleSaveFunc, settings.batchTime, {
      leading: false,
      trailing: true
    })

    nst.onAny((path:any) => {
      if(path.startsWith('@')) return
      handleSave()
    })
    // _
    loadStore()
  } catch (err) {
    console.log('nestore-persist-adapter Error:', err)
    nst.emit(ns.error, err)
  }
}

export default persistAdapter


//~/////////////////////////////////////////////////////////////////////////////////////////////////

/*

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
      const err = 'Could not find package "mongoose"'
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

*/