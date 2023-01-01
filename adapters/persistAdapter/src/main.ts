// import type { Model} from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
import Nestore, { NSTAdapterGenerator, NSTClass, NSTAdapter } from '../../../src/nestore' //~ DEV ONLY
// import { NestoreAdapter, Nestore } from 'nestore'

//~ use ZOD 

//- TODO
//- convert arguments to strictly typed config object
//- convert namespaced events to object provided by nestore that include methods:
//  - adapter.register()


export type TypePersistAdapterConfig = {
  namespace?: string;
  storage?: Storage,
  storageKey: string; 
  batchTime?: number;
  compareSave?: boolean;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const persistAdapterGenerator: NSTAdapterGenerator = (config: TypePersistAdapterConfig) => {
  
  const log = debug(`nestore`).extend('persist-adapter-generator') 
  log('Adapter initializing...')

  
  // adapters are registered within the constructor of nestore
  // so they must wait for instantiation to complete (ee2 in this case)
  // to have access to class methods like 'emit'


  

  const settings:any = {}

  if(!config || typeof config !== 'object' || !Object.keys(config).length){
    // console.log('Nestore persistAdapter requires a config object with at least { "storageKey": <string> }')
    throw new Error('Nestore persistAdapter requires a config object with at least { "storageKey": <string> }')
  }

  //+ if no storage object is provided, try to get localStorage
  if (!config?.storage) {
    if (typeof window !== 'undefined' && typeof window.localStorage === 'object') {
      log('No storage provided, using localStorage')
      settings.storage = window.localStorage
    } else {
      log('No storage provided, and localStorage not available')
      // console.log('nestore-persist-adapter: No storage object provided and localStorage not available.')
      throw new Error('No storage provided, and localStorage not available')
    }
  }
  
  //+ if storage provided - confirm it has getItem and setItem methods
  else{
    if (typeof config.storage?.getItem !== 'function' || typeof config.storage?.setItem !== 'function') {
      log('Storage provided does not contain valid "getItem" and "setItem" methods:', config.storage)
      throw new Error('nestore-persist-adapter: Storage object must have (getItem, setItem) methods.')
    }
    settings.storage = config.storage
  }

  if (typeof config.storageKey === 'undefined' || !config.storageKey.length) {
    throw new Error('Local, session and indexedDB require a storage key')
  }
  settings.storageKey = config.storageKey

  if (typeof config.namespace !== 'string' || config.namespace.length < 3) {
    // console.log('nestore-persist-adapter: No "namespace" provided, using "nestore-persist-adapter"')
    settings.namespace = 'nestore-persist-adapter'
  }else{
    settings.namespace = config.namespace
  }

  if (typeof config.batchTime !== 'number') {
    console.log('nestore-persist-adapter: No "batchTime" provided')
  }else if(config.batchTime > 0 && config.batchTime < (60_000 * 60)){
    settings.batchTime = config.batchTime
  }else{
    settings.batchTime = 250
  }

  settings.compareSave = config.compareSave === false ? false : true


  const persistAdapter: NSTAdapter = async <T>(nst: NSTClass<T>) => {

    const log = debug('nestore').extend('persist-adapter')
    log('Adapter registering...')

    if(!nst){
      log('No reference to NST:', nst)
    }


    const ns = {
      registered: `@.${settings.namespace}.registered`, // => namespace
      error:      `@.${settings.namespace}.error`, // => the error
      loading:    `@.${settings.namespace}.loading`, // => store (before loaded)
      loaded:     `@.${settings.namespace}.loaded`, // => store (after loaded)
      saving:     `@.${settings.namespace}.saving`, // => store (being saved)
      saved:      `@.${settings.namespace}.saved` // => store (what was saved)
    }


    
    
    
    try {

      let loaded = false

      
      //&                                                                                             
      const handleLoad = async () => {
        const _log = log.extend('load')
        try {
          nst.emit(ns.loading, nst.store ?? {})
          
          let sto = {}
          try{
            _log('Loading storage into store...')
            let d = settings.storage?.getItem(settings.storageKey)
            if(!d){
              _log('No data in storage')
            }else{

              _log('Storage loaded. Parsing data...')
              d = JSON.parse(d)
              _log('Successfully parsed json-like data from storage')
              sto = d
            }
          }catch(err){
            _log('Error parsing json-like object from storage:', err)
          }


          sto = typeof sto === 'object' ? sto : {}
          nst.set(sto)
          nst.emit(ns.loaded, sto)
          _log('Storage loaded into store:', sto)
          return true
        } catch (err) {
          _log('Error loading storage with persist adapter:', err)
          nst.emit(ns.error, err)
          return false
        }
      }

      //&                                                                                             
      const handleSave = async () => {
        const _log = log.extend('save')
        try {
          _log('Saving store to storage...')
          nst.emit(ns.saving, nst.store)
          
          const currentNestoreStoreAsString = JSON.stringify(nst.store)
          settings.storage?.setItem(settings.storageKey, currentNestoreStoreAsString)
          
          if(config.compareSave){
            const valueRetrievedFromMockStorageAfterSave = settings.storage?.getItem(settings.storageKey)

            if (valueRetrievedFromMockStorageAfterSave && valueRetrievedFromMockStorageAfterSave === currentNestoreStoreAsString) {
              _log('Store saved to storage')
              nst.emit(ns.saved, nst.store)
              return true
            } else {
              _log('Persist adapter error:', {
                msg: 'The value (v) was saved to storage (s) but (s != v) after saving complete',
                s: valueRetrievedFromMockStorageAfterSave,
                v: currentNestoreStoreAsString
              })
              return false
            }
          }else{
            nst.emit(ns.saved, nst.store)
          }
          return true
        } catch (err) {
          nst.emit(ns.error, err)
          _log('Persist adapter error:', err)
          return false
        }
      }

      //&                                                                                             
      let throttledSave = throttle(handleSave, settings.batchTime, {
        leading: false,
        trailing: true
      })

      nst.onAny((path:any) => {
        if(!path.startsWith('@') && loaded){
          throttledSave()
        }
      })
      // _
      log('Adapter registered. Loading data...')
      await handleLoad()
      loaded = true
      
      nst.emit(ns.registered, settings.namespace)
      return {
        namespace: settings.namespace,
        load: handleLoad,
        save: handleSave
      }
    } catch (err) {
      let e:any = err
      console.log('nestore-persist-adapter Error:', e)
      nst.emit(ns.error, e)
      throw new Error(e.message ?? e.toString() ?? e)
    }
  }

  return persistAdapter
}

export default persistAdapterGenerator
