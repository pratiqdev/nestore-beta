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

  // console.log('-'.repeat(60))
  // console.log('storage:', {
  // local: window.localStorage,
  // sess: window.sessionStorage
  // })
  // console.log('-'.repeat(60))

  if (typeof config.storage === 'undefined' || !config.storage) {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      log('No storage provided, using localStorage')
      config.storage = window.localStorage
    } else {
      log('No storage provided, and localStorage not available')
      console.log('Nestore persist: No storage object provided and localStorage not available.')
      return
    }
  }
  if (typeof config.storage?.getItem !== 'function' || typeof config.storage?.setItem !== 'function') {
    console.log('Nestore persist: Storage object must have (getItem, setItem) methods.')
    return
  }
  if (typeof config.storageKey === 'undefined' || !config.storageKey.length) {
    log('Local, session and indexedDB require a storage key')
    return
  }
  if (typeof config.namespace !== 'string' || config.namespace.length < 3) {
    console.log('Nestore persist:: No "namespace" provided')
    return
  }
  if (typeof config.batchTime !== 'number') {
    console.log('Nestore persist:: No "batchTime" provided')
    return
  }

  const ns = {
    registered: `@${config.namespace}.registered`, // => namespace
    loading: `@${config.namespace}.loading`, // => store (before loaded)
    loaded: `@${config.namespace}.loaded`, // => store (after loaded)
    saving: `@${config.namespace}.saving`, // => store (being saved)
    saved: `@${config.namespace}.saved`, // => store (what was saved)
    error: `@${config.namespace}.error` // => the error
  }

  log('Nestore persist adapter registered:', config.namespace)
  // nst.emit(ns.registered, {
  //     adapter: 'persistAdapter',
  //     storageKey,
  //     storage,
  //     namespace,
  //     batchTime
  // })

  try {
    let storeLoaded = false
    let handleSave:any

    // _
    const loadStore = async () => {
      const log = createLog('persist:load')
      const loadStartTime = Date.now()
      try {
        if (storeLoaded) return
        // log(`Loading: Time since adapter start:`, Date.now() - adapterStartTime + ` ms`)
        log('Loading storage into store...')
        // nst.emit(ns.loading, nst.store)

        const storedData = config.storage?.getItem(config.storageKey) ?? '{}'
        const sto = JSON.parse(storedData)

        // await new Promise(res => setTimeout(res, 1500))

        // if(storedData !== '{}'){
        //     nst.set(sto, null, 'quiet')
        //     // nst.store = sto
        // }else{
        //     log(`Empty object returned from storage, skipping nst.set()`)
        // }
        // nst.emit(ns.loaded, sto)
        // log(`Loaded: Time since adapter start:`, Date.now() - adapterStartTime + ` ms`)
        // log(`Loaded: Time since load start:`, Date.now() - loadStartTime + ` ms`)
        log('Storage loaded into store:', sto)
        //! loaded(namespace, sto)
        storeLoaded = true
      } catch (err) {
        log('Error loading storage with persist adapter:', err)
        // nst.emit(ns.error, err)
        //! error(namespace, err)
      }
    }

    // _
    const handleSaveFunc = () => {
      try {
        const log = createLog('persist:save')
        //! saving(namespace)
        log('Saving store to storage...')
        // nst.emit(ns.saving, nst.store)
        const stringStore = JSON.stringify(nst.store)

        config.storage?.setItem(config.storageKey, stringStore)
        const savedValue = config.storage?.getItem(config.storageKey)

        if (savedValue && savedValue === stringStore) {
          // nst.emit(ns.saved, JSON.parse(savedValue))
          //! saved(namespace, JSON.parse(savedValue))
          log('Store saved to storage')
        } else {
          const msg = 'Saved value does not match the current store after save was completed'
          // nst.emit(ns.error, msg)
          //! error(namespace, msg)
          log('Persist adapter error:', msg)
        }
      } catch (err) {
        // nst.emit(ns.error, err)
        //! error(namespace, err)
        log('Persisadapter error:', err)
      }
    }

    // _
    handleSave = throttle(handleSaveFunc, config.batchTime, {
      leading: false,
      trailing: true
    })

    // _
    //! onUpdate((data:any) => {
    //!   !data.startsWith('@') && handleSave()
    //! })

    loadStore()
  } catch (err) {
    console.log('Nestore persist error:', err)
    // nst.emit(ns.error, err)
    //! error(namespace, err)
  }
}

export default persistAdapter
