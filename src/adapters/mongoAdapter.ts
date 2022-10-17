import { T_NestoreAdapter, T_Nestore } from "../nestore";
// import type { Model } from 'mongoose'
import debug from 'debug'
import { throttle } from 'lodash-es'

const createLog = (namespace:string) => debug('nestore:' + namespace)











//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
export const mongoAdapter: T_NestoreAdapter = (

    mongoUri: string, 
    collectionName: string,
    documentKey: string,
    namespace:string = 'mongo-adapter', 
    batchTime:number = 10_000

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
        registered: `@${namespace}.registered`, // => namespace
        error: `@${namespace}.error`, // => the error
        loading: `@${namespace}.loading`, // => store (before loaded)
        loaded: `@${namespace}.loaded`, // => store (after loaded)
        saving: `@${namespace}.saving`, // => store (being saved)
        saved: `@${namespace}.saved`, // => store (what was saved)
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
            var Model:any = mongoose.model(collectionName, modelSchema, collectionName);

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
                    nst.set(result?.store ?? {}, null, 'quiet')
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
