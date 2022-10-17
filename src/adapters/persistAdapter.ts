import { T_NestoreAdapter, T_Nestore } from "../nestore";
// import type { Model} from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
const createLog = (namespace:string) => debug('nestore:' + namespace)



//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const persistAdapter: T_NestoreAdapter = (

    storageKey: string,
    storage: Storage,
    namespace:string = 'nestore-persist', 
    batchTime:number = 10_000

) => <T>({ registered, error, loading, loaded, saved, saving, store, onUpdate  }:any) => {
    
    const adapterStartTime:number = Date.now()

    const log = createLog('persist')

    // console.log('-'.repeat(60))
    // console.log('storage:', {
        // local: window.localStorage,
        // sess: window.sessionStorage
    // })
    // console.log('-'.repeat(60))
    
    if(typeof storage === 'undefined' || !storage){
        if(typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'){
            log('No storage provided, using localStorage')
            storage = window.localStorage
        }else{
            log('No storage provided, and localStorage not avilable')
            console.log(`Nestore persist: No storage object provided and localStorage not available.`)
            return;
        }
        
    }
    if(typeof storage?.getItem !== 'function' || typeof storage?.setItem !== 'function'){
        console.log(`Nestore persist: Storage object must have (getItem, setItem) methods.`)
        return;
    }
    if(typeof storageKey === 'undefined' || !storageKey.length){
        log(`Local, session and indexedDB require a storage key`)
        return;
    }
    if(typeof namespace !== 'string' || namespace.length < 3){
        console.log('Nestore persist:: No "namespace" provided')
        return;
    }
    if(typeof batchTime !== 'number'){
        console.log('Nestore persist:: No "batchTime" provided')
        return;
    }
    
    const ns = {
        registered: `@${namespace}.registered`, // => namespace
        loading: `@${namespace}.loading`, // => store (before loaded)
        loaded: `@${namespace}.loaded`, // => store (after loaded)
        saving: `@${namespace}.saving`, // => store (being saved)
        saved: `@${namespace}.saved`, // => store (what was saved)
        error: `@${namespace}.error`, // => the error
    }
    
    log('Nestore persist adapeter registered:', namespace)
    // nst.emit(ns.registered, {
    //     adapter: 'persistAdapter',
    //     storageKey,
    //     storage,
    //     namespace, 
    //     batchTime
    // })
    registered(namespace)
    
    
    try{
        let storeLoaded = false
        let handleSave:any
        

      



        //_                                                                                     
        const loadStore = async () => {
            const log = createLog('persist:load')
            const loadStartTime = Date.now()
            try{
                if(storeLoaded) return;
                // log(`Loading: Time since adapter start:`, Date.now() - adapterStartTime + ` ms`)
                log(`Loading storage into store...`)
                // nst.emit(ns.loading, nst.store)
                loading(namespace)
                
                let storedData = storage.getItem(storageKey) ?? '{}'
                let sto = JSON.parse(storedData)
                
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
                log(`Storage loaded into store:`, sto)
                loaded(namespace, sto)
                storeLoaded = true
            }catch(err){
                log(`Error loading storage with persist adapter:`, err)
                // nst.emit(ns.error, err)
                error(namespace, err)
            }
        }

        //_                                                                                     
        const handleSaveFunc = () => {
            try{
                const log = createLog('persist:save')
                saving(namespace)
                log(`Saving store to storage...`)
                // nst.emit(ns.saving, nst.store)
                let stringStore = JSON.stringify(store)

                storage.setItem(storageKey, stringStore)
                let savedValue = storage.getItem(storageKey)

                if(savedValue && savedValue === stringStore){
                    // nst.emit(ns.saved, JSON.parse(savedValue))
                    saved(namespace, JSON.parse(savedValue))
                    log(`Store saved to storage`)
                }else{
                    let msg = `Saved value does not match the current store after save was completed`
                    // nst.emit(ns.error, msg)
                    error(namespace, msg)
                    log(`Persist adapter error:`, msg)
                }
            }catch(err){
                // nst.emit(ns.error, err)
                error(namespace, err)
                log(`Persisadapter error:`, err)
            }
        }

        //_                                                                                     
        handleSave = throttle(handleSaveFunc, batchTime, {
            leading: false,
            trailing: true,
        })
        
        //_                                                                                     
        onUpdate((data:any) => {
            !data.startsWith('@') && handleSave()
        })

        loadStore()

       
    }catch(err){
        console.log('Nestore persist error:', err)
        // nst.emit(ns.error, err)
        error(namespace, err)
    }
}



export default persistAdapter