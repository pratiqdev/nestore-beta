// import type { Model} from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
//@ts-ignore
import Nestore, { TypeNestore, TypeNestoreAdapter, TypeNestoreClass } from '../../../src/nestore' //~ DEV ONLY
// import { NestoreAdapter, Nestore } from 'nestore'

const createLog = (namespace:string) => debug(`nestore:${namespace}`)

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

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const persistAdapter: TypeNestoreAdapter = (
  config: TypePersistAdapterConfig
) => async <T>(nst: TypeNestoreClass<T>) => {
  const adapterStartTime:number = Date.now()

  const log = createLog('persist')

  const settings:any = {
  }

  // console.log('-'.repeat(60))
  // console.log('storage:', {
  // local: window.localStorage,
  // sess: window.sessionStorage
  // })
  // console.log('-'.repeat(60))

  if (typeof config.storage === 'undefined' || !config.storage) {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      log('No storage provided, using localStorage')
      settings.storage = window.localStorage
    } else {
      log('No storage provided, and localStorage not available')
      console.log('nestore-persist-adapter: No storage object provided and localStorage not available.')
      return
    }
  }
  if (typeof config.storage?.getItem !== 'function' || typeof config.storage?.setItem !== 'function') {
    console.log('nestore-persist-adapter: Storage object must have (getItem, setItem) methods.')
    return
  }
  settings.storage = config.storage

  if (typeof config.storageKey === 'undefined' || !config.storageKey.length) {
    log('Local, session and indexedDB require a storage key')
    return
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

  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  //~ WHY ARE NAMESPACES NOT BEING EMITTED ???????? 
  const ns = {
    registered: `@.${settings.namespace}.registered`, // => namespace
    loading: `@.${settings.namespace}.loading`, // => store (before loaded)
    loaded: `@.${settings.namespace}.loaded`, // => store (after loaded)
    saving: `@.${settings.namespace}.saving`, // => store (being saved)
    saved: `@.${settings.namespace}.saved`, // => store (what was saved)
    error: `@.${settings.namespace}.error` // => the error
  }

  log('Nestore persist adapter registered:', settings.namespace)
  
  try {
    let storeLoaded = false
    let handleSave:any
    nst.emit(ns.registered, settings.namespace)
    
    // _
    const loadStore = async () => {
      const log = createLog('persist:load')
      try {
        if (storeLoaded) return
        log('Loading storage into store...')
        nst.emit(ns.loading, nst.store)

        const storedData = settings.storage?.getItem(settings.storageKey) ?? '{}'
        const sto = JSON.parse(storedData)

        nst.emit(ns.loaded, sto)
        log('Storage loaded into store:', sto)
        //! loaded(namespace, sto)
        storeLoaded = true
      } catch (err) {
        log('Error loading storage with persist adapter:', err)
        nst.emit(ns.error, err)
        //! error(namespace, err)
      }
    }

    // _
    const handleSaveFunc = () => {
      try {
        const log = createLog('persist:save')
        //! saving(namespace)
        log('Saving store to storage...')
        nst.emit(ns.saving, nst.store)
        const stringStore = JSON.stringify(nst.store)

        settings.storage?.setItem(settings.storageKey, stringStore)
        const savedValue = settings.storage?.getItem(settings.storageKey)

        if (savedValue && savedValue === stringStore) {
          nst.emit(ns.saved, JSON.parse(savedValue))
          //! saved(namespace, JSON.parse(savedValue))
          log('Store saved to storage')
        } else {
          const msg = 'Saved value does not match the current store after save was completed'
          nst.emit(ns.error, msg)
          //! error(namespace, msg)
          log('Persist adapter error:', msg)
        }
      } catch (err) {
        nst.emit(ns.error, err)
        //! error(namespace, err)
        log('Persisadapter error:', err)
      }
    }

    // _
    handleSave = throttle(handleSaveFunc, settings.batchTime, {
      leading: false,
      trailing: true
    })

    // _
    //! onUpdate((data:any) => {
    //!   !data.startsWith('@') && handleSave()
    //! })

    loadStore()
  } catch (err) {
    console.log('nestore-persist-adapter Error:', err)
    // nst.emit(ns.error, err)
    //! error(namespace, err)
  }
}

export default persistAdapter
