import { T_NestoreAdapter, T_Nestore } from "./nestore";
import type { Model} from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'
const createLog = (namespace:string) => debug('nestore:' + namespace)


export type T_AnyStore = {
    get: (...args:any[]) => any; 
    set: (...args:any[]) => any;
} | {
    getItem: (...args:any[]) => any;
    setItem: (...args:any[]) => any;
}


export type T_AdapterEmit = {
    timestamp: number;
    action: string;
    store: any;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const persistAdapter: T_NestoreAdapter = (

    storage: T_AnyStore, 
    namespace:string = 'nestore-persist', 
    batchTime:number = 2_000

) => <T>(nst: T_Nestore<T>) => {
    
    const log = createLog('mid')

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
    if(typeof namespace !== 'string' || namespace.length < 3){
        console.log('Nestore persist:: No "namespace" provided')
        return;
    }
    if(typeof batchTime !== 'number'){
        console.log('Nestore persist:: No "batchTime" provided')
        return;
    }
    
    const ns = {
        registered: `@.${namespace}.registered`, // => namespace
        loading: `@.${namespace}.loading`, // => store (before loaded)
        loaded: `@.${namespace}.loaded`, // => store (after loaded)
        saving: `@.${namespace}.saving`, // => store (being saved)
        saved: `@.${namespace}.saved`, // => store (what was saved)
        error: `@.${namespace}.error`, // => the error
    }
    
    try{
        let GET: any = null
        let SET: any = null
        let storeLoaded = false
        let handleSave:any
        
        if('get' in storage)     GET = storage.get
        if('set' in storage)     SET = storage.set
        if('getItem' in storage) GET = storage.getItem
        if('setItem' in storage) SET = storage.setItem

        if(!GET || !SET){
            console.log(`Nestore persist: Storage object must have (get, set) or (getItem, setItem) methods.`)
            return;
        }

        log('MIDDLWARE REGISTERED:', namespace)


        //_                                                                                     
        const loadStore = async () => {
            const log = createLog('mid:load')
            try{
                if(storeLoaded) return;
                nst.emit(ns.loading, 'LOADING:', GET())
                log(`loading...`)
                await new Promise(res => setTimeout(res, 1500))
                let sto = GET()
                nst.set(sto)
                nst.emit(ns.loaded, 'LOADED:', sto)
                log(`loaded:`, sto)
                storeLoaded = true
            }catch(err){
                log(`Error loading data with middleware:`, err)
                nst.emit(ns.error, err)
            }
        }

        //_                                                                                     
        const handleSaveFunc = () => {
            try{
                // handleSave?.cancel && handleSave.cancel()
                const log = createLog('mid:save')
                log(`Saving store`)
                nst.emit(ns.saving, 'SAVING:', nst.store)
                SET(nst.store)
                nst.emit(ns.saved, 'SAVED:', nst.store)
                log(`Store saved`)
            }catch(err){
                nst.emit(ns.error, err)
                log(`Error saving data with middleware`)
            }
        }

        //_                                                                                     
        handleSave = throttle(handleSaveFunc, batchTime, {
            leading: false,
            trailing: true,
        })
        
        //_                                                                                     
        nst.onAny((data:any) => {
            // ignore middleware events '@mid-event'
            if(data.startsWith('@')) return;
            // createLog('middleware:event')('nst:* middleware event:', data)
            // handleSave.cancel()
            handleSave()
        })

        loadStore()
        
    }catch(err){
        console.log('Nestore persist error:', err)
        nst.emit(ns.error, err)
    }
}







//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const mongoAdapter = (

    mongoUri: string, 
    collectionName: string,
    documentKey: string,
    namespace:string = 'mongo-adapter', 
    batchTime:number = 2_000

) => async <T>(nst: T_Nestore<T>) => {
    
    const log = createLog('mongo')
    log('Mongo adapter initializing...')

    if(typeof mongoUri !== 'string' || mongoUri.length < 10){
        console.log(`Nestore ${namespace} error: Must provide valid "mongoUri" mongodb connection string.`)
        return;
    }
    if(typeof collectionName !== 'string' || collectionName.length < 10){
        console.log(`Nestore ${namespace} error: Must provide valid "collectionName" mongodb collection name.`)
        return;
    }
    if(typeof documentKey !== 'string' || documentKey.length < 1){
        documentKey = collectionName
    }
    if(typeof namespace !== 'string' || namespace.length < 3){
        console.log(`Nestore ${namespace} error: No "namespace" provided.`)
        return;
    }
    if(typeof batchTime !== 'number'){
        console.log(`Nestore "${namespace}" error: No "batchTime" provided.`)
        return;
    }
    
    const ns = {
        registered: `@.${namespace}.registered`, // => namespace
        error: `@.${namespace}.error`, // => the error
        loading: `@.${namespace}.loading`, // => store (before loaded)
        loaded: `@.${namespace}.loaded`, // => store (after loaded)
        saving: `@.${namespace}.saving`, // => store (being saved)
        saved: `@.${namespace}.saved`, // => store (what was saved)
    }
    
    try{
        nst.emit(ns.registered, namespace)

        let db:any
        let mongoose:any
        // NEXT_PUBLIC_MONGO_URI = mongodb+srv://pratiqdev:%23MagnusIgnotus%267@cluster0.bz31t.mongodb.net/?retryWrites=true&w=majority
        // let mongoUri = 'mongodb+srv://pratiqdev:%23MagnusIgnotus%267@cluster0.bz31t.mongodb.net/?retryWrites=true&w=majority'
        // let connectionString = `mongodb://localhost:27017/crud`

        try{
            // ignore because tsc will always throw an error for a missing module
            //@ts-ignore
            log('importing module: "mongoose"...')
            let {default: mod} = await import('mongoose')
            log('... "mongoose" imported')
            
            mongoose = mod

        }catch(err){
            console.log(`Error: Cannot find package: "mongoose"`)
            nst.emit(ns.error, `Error: Cannot find package: "mongoose"`)
        }


        if(!mongoose){
            let err = `Could not import module "mongodb"`
            console.log(err)
            nst.emit(ns.error, err)
            return;
        }

        let storeLoaded = false


        const onMongoConnect = () => {
            console.log('--- CONNECTED ---')
            const _log = createLog('mongo:on-connect')
            log('mongoose connected')
            _log('mongoose connected')
            var modelSchema = new mongoose.Schema({}, { strict: false });
            var Model:Model<any> = mongoose.model(collectionName, modelSchema, collectionName);

            const loadStore = async () => {
                const log = createLog('mongo:load')
                try{
                    if(storeLoaded) return;
                    log(`-`.repeat(60))
                    log(`loading collection "${collectionName}" - document "${documentKey}"...`)
                    nst.emit(ns.loading, nst.store)

                    
                    let result = await Model.findOne({ key: documentKey })
                    if(result && result.store){
                        log(`loaded:`, result.store)
                        nst.set(result.store)
                        nst.emit(ns.loaded, nst.store)
                    }else{
                        log(`loaded: no data... skipping nst.set() - `, result)
                        nst.emit(ns.loaded, nst.store)
                    }
                    storeLoaded = true
                }catch(err){
                    log(`-`.repeat(60))
                    log(`Error loading data with middleware:`, err)
                    log(`-`.repeat(60))
                    nst.emit(ns.error, err)
                }
            }
    
            //_                                                                                     
            const handleSaveFunc = async () => {
                try{
                    // handleSave?.cancel && handleSave.cancel()
                    const log = createLog('mongo:save')
                    const currentStore = nst.store
                    log(`-`.repeat(60))
                    nst.emit(ns.saving, currentStore)
                    log(`Saving store:`, currentStore)

                    log(`Checking if document exists: "${documentKey}"`)
                    let result = await Model.findOne({ key: documentKey })
                    log(`Result A:`, result)
                    
                    if(!result){
                        log(`No document found... creating document: "${documentKey}"`)
                        result = await Model.create({
                            key: documentKey,
                            store: currentStore
                        })
                        log(`Result B:`, result)
                    }else{
                        log(`Document found... updating document`)
                        result = await Model.findOneAndUpdate({ key: documentKey }, { store: currentStore }, { new: false, overwrite: true, })
                        log(`Result C:`, result)
                    }

                    // log('db after save:', result)
                    nst.set(result?.store ?? {}, null, true)
                    nst.emit(ns.saved, nst.store)
                    log(`Store saved`)
                }catch(err){
                    log(`-`.repeat(60))
                    nst.emit(ns.error, err)
                    log(`Error saving data with middleware`)
                    log(`-`.repeat(60))
                }
            }
    
            //_                                                                                     
            const handleSave = throttle(handleSaveFunc, batchTime, {
                leading: false,
                trailing: true,
            })
            
            //_                                                                                     
            nst.onAny((data:any) => {
                if(data.startsWith('@')) return;
                handleSave()
            })
    
            loadStore()

        }

        log(`Mongoose connecting...`)
        mongoose.connect(
            mongoUri,
            {
              useNewUrlParser: true,
            //   useFindAndModify: false,
              useUnifiedTopology: true
            }
        );    

        db = mongoose.connection;

        db.once('open', () => onMongoConnect())
        db.on('error', (err:any) => console.log(`MONGOOSE ERROR:`, err))

        nst.emit(ns.registered, true)

        // onMongoConnect()

        // mongodb.connect(
            // mongoUri,
            // { useNewUrlParser: true, useUnifiedTopology: true },
            // onMongoConnect
        // )
        /*
        db.collection('data').insertOne({ text: req.body.text }, function (
            err,
            info
          ) {
            res.json(info.ops[0])
          })
        */

           //_                                                                                     
       

        
    }catch(err){
        log(`-`.repeat(60))
        console.log(`Nestore "${namespace}" error:`, err)
        nst.emit(ns.error, err)
        log(`-`.repeat(60))
    }
}
