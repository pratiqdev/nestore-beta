import EE2 from "eventemitter2";
import * as lodash from 'lodash-es'
import { T_EmitStruct, T_NestoreOptions } from "./interfaces";
import log from './log.js'
import BUILT_IN_DIFF from "./built-in-diff.js";




class nestoreClass extends EE2 {
    INTERNAL_STORE: Object; // ESMap<string, any>;
    ORIGINAL_STORE: Object; // ESMap<string, any>;
    DIFF_FUNC: Function;
    DELIMITER: string;
    ALLOW_DIRECT_MOD: boolean;
    PATH_LIST: string[];

    constructor(store: Object = {}, options: T_NestoreOptions = {}){
        super({
            wildcard: options.wildcard === false ? false : true,
            delimiter: typeof options.delimiter === 'string' ? options.delimiter : '.',
            verboseMemoryLeak: options.verboseMemoryLeak === true ? true : false,
            maxListeners: typeof options.maxListeners === 'number' 
                && options.maxListeners <= Number.MAX_SAFE_INTEGER
                && options.maxListeners >= Number.MIN_SAFE_INTEGER
                    ? options.maxListeners
                    : 10
        })

        

        log.constr('='.repeat(80))
        log.constr('Creating store')

        if(typeof store !== 'object' || Array.isArray(store)){
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }

        this.ALLOW_DIRECT_MOD = options.allowDirectModification === true ? true : false;
        this.INTERNAL_STORE = lodash.cloneDeep(store)
        this.ORIGINAL_STORE = lodash.cloneDeep(store)
        this.DIFF_FUNC = typeof options.diffFunction === 'function' ? options.diffFunction : BUILT_IN_DIFF
        this.DELIMITER = typeof options.delimiter === 'string' ? options.delimiter : '.'
        this.PATH_LIST = []

        this.#keyCount()

        if(store instanceof nestoreClass){
            return store;
        }
    }

    //_                                                                                             
    #keyCount(){
        this.PATH_LIST = []
         
        const visitNodes = (obj:any, visitor:any, stack:any[] = []) => {
            if (typeof obj === 'object') {
              for (let key in obj) {
                visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
                visitNodes(obj[key], visitor, [...stack, key]);
              }
            } else {
              visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
            }
        }

        visitNodes(this.INTERNAL_STORE, (_path:string, value:any) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPath(_path)
            .filter(x => x.trim() !== '')
            
            // let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join('/') : '/'


            if(!this.PATH_LIST.includes(path)){
                this.PATH_LIST.push(path)
                log.set(`keyCount: Counting key at: ${path}`)
            }

        });







        // const visitNodes = (obj:any) => {
        //     if (typeof obj === 'object') {
        //       for (let key in obj) {
        //         log.set(`> keyCount: increasing keycount with:`, key)
        //         let p = `${key}/${obj[key]}`

        //         this.KEY_COUNT++
        //         visitNodes(obj[key]);
        //       }
        //     } else {
        //         log.set(`  keyCount: increasing keycount with:`, obj)
        //         this.KEY_COUNT++
        //     }
        // }

        // visitNodes(this.INTERNAL_STORE)
    }

    //_                                                                                             
    #emit(key:string, args:T_EmitStruct) {
        log.emit(`Emitting  "${key}" :`, args)
        if(key === '*'){
            return this.emit('*', args);
        }else{
            return this.emit(key, args) || this.emit('', args);
        }
    }

    //_                                                                                             
    #handleEmitAll = () => {
        log.emitAll('Parsing store to emit events for every key...')

        let emitted:string[] = []

         
        const visitNodes = (obj:any, visitor:any, stack:any[] = []) => {
            if (typeof obj === 'object') {
              for (let key in obj) {
                visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
                visitNodes(obj[key], visitor, [...stack, key]);
              }
            } else {
              visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
            }
        }

        visitNodes(this.INTERNAL_STORE, (_path:string, value:any) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPath(_path)
            .filter(x => x.trim() !== '')
            
            let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join('/') : '/'


            if(!emitted.includes(path)){
                emitted.push(path)
                
                // log.emitAll(`EMITTING: "${path}" => "${value}"`)
                this.#emit(path, {
                    key,
                    path,
                    value,
                })
            }

        });
          
    }

    //_                                                                                             
    #splitPath(path:string){
       return path.split(/\[|\]\[|\]\.|\.|\]/g)
    }

    //_                                                                                             
    #splitPathToKey(path:string){
        let split = this.#splitPath(path)
        return split[split.length - 1]
    }





    //&                                                                                             
    setStore = (_store: Object = {}) => {
        try{
            // console.log(`setting "${path}" => "${value}"`)
            // const _log = log.extend('set')
            log.set(`Setting new store "/" : "${_store}"`)

            if(!(typeof _store === 'object' && !Array.isArray(_store))) {
                log.set(`setStore requires a new store object: setStore({ ...newStore })`)
                return false
            }

            this.#keyCount()
            this.#handleEmitAll()

            return true
        }catch(err){
            return false
        }

    }

    //&                                                                                             
    set = (path:string | Object, value?:any) => {
        try{
            log.set(`Setting "${path}" : "${value}"`)

            if(
                (!path && value) 
                || (typeof path !== 'object' && !value)
            ){
                log.set('Incorrect args for "set()". Returning false')
                return false;
            } 

            
            
            // set the store directly with an object
            // NST.set({ ...newStore })
            if(typeof path === 'object'){
                if(Array.isArray(path)){
                    lodash.set(this.INTERNAL_STORE, path, value)
                }else{
                    this.INTERNAL_STORE = path
                    this.#emit('/', {
                        path: '/',
                        key: '/',
                        value: this.store,
                    })
                }
                
                this.#keyCount()
                return true
            }

            
            lodash.set(this.INTERNAL_STORE, path, value)
            this.#emit(path, {
                path,
                // key: pathList[pathList.length - 1],
                key: this.#splitPathToKey(path),
                value,
            })
            this.#keyCount()
            return true
        }catch(err){
            return false
        }

    }

    //&                                                                                             
    get = (path?: string | Function) => {
        try{
            log.get(`Getting "${path}"`)
            if(!path) return this.store
            
            if(typeof path === 'function'){
                return path(this.INTERNAL_STORE)
            }

            return lodash.get(this.INTERNAL_STORE, path)

            // let x1 = this.INTERNAL_STORE.get(path)

            // if(x1){
            //     return x1
            // }else{

            //     var schema:any = this.INTERNAL_STORE;  // a moving reference to internal objects within obj
            //     var pathList:string[] = path.split('.');
            //     pathList = pathList.map(p => p.replace(/"+|`+|'+|]+/gm, '').split('[')).flat()
            //     var depth:number = pathList.length;
            //     for(var i = 0; i < depth-1; i++) {
            //         var elem = pathList[i];
            //         if( !schema[elem] ) schema[elem] = {}
            //         schema = schema[elem];
            //     }
            //     return schema[pathList[depth-1]]
            // }
            
        }catch(err){
            return undefined
        }
    }

    //&                                                                                             
    reset = () => {
        this.INTERNAL_STORE = this.ORIGINAL_STORE
        this.#keyCount()
        this.#emit('nestore-reset', {
            path: '/',
            key: 'NESTORE_RESET',
            value: this.INTERNAL_STORE
        })
        this.#handleEmitAll()
    }



    get entries(){ return Object.entries(this.INTERNAL_STORE) }
    get keys(){ return Object.keys(this.INTERNAL_STORE) }
    get values(){ return Object.values(this.INTERNAL_STORE) }
    get paths(){ return this.PATH_LIST }


    //&                                                                                             
    get store() { 
        return this.ALLOW_DIRECT_MOD 
            ? this.INTERNAL_STORE 
            : lodash.cloneDeep(this.INTERNAL_STORE)
    }



}

const NST = (store?:Object, options?: T_NestoreOptions) => new nestoreClass(store, options)


export default NST