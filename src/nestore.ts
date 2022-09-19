import EE2 from "eventemitter2";
import debug from 'debug'
import _ from 'underscore'
import { T_EmitStruct } from "./interfaces";
import path from "path";

const l = debug('nestore')
// debug.enable('nestore:*')


const log = {
    constr: l.extend('constructor'),
    set: l.extend('set'),
    get: l.extend('get'),
    reset: l.extend('reset'),
    emit: l.extend('emit'),
    emitAll: l.extend('emitAll'),
}
// console.log('NESTORE')

function diff(a:any,b:any) {
    var r:any = {};
    _.each(a, function(v:any,k:any) {
        if(b[k] === v) return;
        // but what if it returns an empty object? still attach?
        r[k] = _.isObject(v)
                ? diff(v, b[k])
                : v
            ;
        });
    return r;
}


// var emitter = new EE2({

//     // set this to `true` to use wildcards
//     wildcard: false,
  
//     // the delimiter used to segment namespaces
//     delimiter: '.', 
  
//     // set this to `true` if you want to emit the newListener event
//     newListener: false, 
  
//     // set this to `true` if you want to emit the removeListener event
//     removeListener: false, 
  
//     // the maximum amount of listeners that can be assigned to an event
//     maxListeners: 10,
  
//     // show event name in memory leak message when more than maximum amount of listeners is assigned
//     verboseMemoryLeak: false,
  
//     // disable throwing uncaughtException if an error event is emitted and it has no listeners
//     ignoreErrors: false
//   });

export type T_NestoreConfig = {
    diffFunction?: (a:any, b:any) => boolean;
    delimiter?: string;
    wildcard?: boolean;
    maxListeners?: number;
    verboseMemoryLeak?: boolean;
}



class nestoreClass extends EE2 {
    internalStore: any;
    originalStore: any
    diffFunc: Function;
    delimiter: string;

    constructor(store: Object = {}, config: T_NestoreConfig = {}){
        super({
            wildcard: config.wildcard === false ? false : true,
            delimiter: typeof config.delimiter === 'string' ? config.delimiter : '.',
            verboseMemoryLeak: config.verboseMemoryLeak === true ? true : false,
            maxListeners: typeof config.maxListeners === 'number' 
                && config.maxListeners <= Number.MAX_SAFE_INTEGER
                && config.maxListeners >= Number.MIN_SAFE_INTEGER
                    ? config.maxListeners
                    : 10
        })

        log.constr('='.repeat(80))
        log.constr('Creating store')
        if(typeof store !== 'object' || Array.isArray(store)){
            throw new Error("neStore | Initial store must be of type: object");
            
        }
        this.internalStore = store
        this.originalStore = {...store} // fake deep clone to break ref
        this.diffFunc = typeof config.diffFunction === 'function' ? config.diffFunction : diff
        this.delimiter = typeof config.delimiter === 'string' ? config.delimiter : '.'


        
        //$ Not a reliable way to propagate changes to the store
        //$ suggest use of "set()" method when attempting to trigger updates
        // this.onAny((data:any)=>{
        //      console.log('this.onAny => ', data)
        // })
    }

    #emit(key:string, args:T_EmitStruct) {
        log.emit(`Emitting  "${key}" :`, args)
        if(key === '*'){
            return this.emit('*', args);
        }else{
            return this.emit(key, args) || this.emit('', args);
        }
    }

    //&                                                                                             
    set = (path:string | Function, value?:any) => {
        try{
            // const _log = log.extend('set')
            log.set(`Setting "${path}" : "${value}"`)
            if(!path || (typeof path !== 'function' && !value)){
                log.set('Incorrect args for "set()". Returning false')
                return false;
            } 


            //+ set(s => s.title = 'value')

            
            //~ This method of updating the store is not recommended                
            //~ diffing is flawed and does not promote use of wildcard listeners    
            if(typeof path === 'function'){
                let tempStore = {...this.internalStore}
                path(this.internalStore)
                let changeMap = diff(this.internalStore, tempStore)
                Object.entries(changeMap).forEach((item:any) => {
                    // console.log('changeMap:', item)
                    this.#emit(item[0], item[1])
                })
                return
            }
            //%             asdffdasasdfsdf                                         

            var schema:any = this.internalStore;  // a moving reference to internal objects within obj
            var pathList:string[] = path.split(this.delimiter);
            pathList = pathList.map(p => p.replace(/"+|`+|'+|]+/gm, '').split('[')).flat()
            var depth:number = pathList.length;
            for(var i = 0; i < depth-1; i++) {
                var elem = pathList[i];
                if( !schema[elem] ) schema[elem] = {}
                schema = schema[elem];
            }
        
            schema[pathList[depth-1]] = value;
            this.#emit(path, {
                path,
                key: pathList[pathList.length - 1],
                value,
            })
            return true
        }catch(err){
            return false
        }

    }

    //&                                                                                             
    //! https://stackoverflow.com/a/58314926/3806481 => _lodash.get alternatives
    get = (path:string | Function) => {
        try{
            log.get(`Getting "${path}"`)
            if(!path) return this.internalStore;
            
            if(typeof path === 'function'){
                return path(this.internalStore)
            }
            
            var schema:any = this.internalStore;  // a moving reference to internal objects within obj
            var pathList:string[] = path.split('.');
            pathList = pathList.map(p => p.replace(/"+|`+|'+|]+/gm, '').split('[')).flat()
            var depth:number = pathList.length;
            for(var i = 0; i < depth-1; i++) {
                var elem = pathList[i];
                if( !schema[elem] ) schema[elem] = {}
                schema = schema[elem];
            }
            
            return schema[pathList[depth-1]]
        }catch(err){
            return undefined
        }
    }



    //&                                                                                             
    #handleEmitAll = () => {
        // const _log = log.extend('$handleEmitAll')
        log.emitAll('Parsing store to emit events')

        let paths:string[] = []
        let depth =  0
        
        const switchRecurseTypes = (key:string, obj:any, overrideDepth?: number) => {
            // log.emitAll(`Recursing (${paths.length}) thru: "${paths.join('/')}"\n`) 
            
            

            // isObject = recurse
            if(typeof obj === 'object' && !Array.isArray(obj)){
                log.emitAll('\n\n'+`=`.repeat(80))
                log.emitAll(`\n"${key}" has type <object>`)
                
                let testPaths = paths.includes(key) ? paths : [...paths, key]

                log.emitAll(`\t| Paths  : ${paths}`)
                log.emitAll(`\t| Key    : ${key}`)
                log.emitAll(`\tTest path: ${testPaths}`)

                if(key !== 'NESTORE_STORE_ROOT_KEY' && !paths.length){
                    paths.push(key)
                    log.emitAll(`\tNot root-path and no paths yet, setting path to: ${paths}`)
                }
                
                
                Object.entries(obj).forEach(([_key, _val], idx) => {
                    log.emitAll(`-`.repeat(40))
                    log.emitAll(`\t\tParsing "${_key}" : "${_val}"`)

                    if(
                        paths.length 
                    ){
                        // if(idx === 0) depth = 1
                        let depth = paths.length - 1
                        log.emitAll(`\t\tRemoving paths at depth: ${depth}`)
                        if(idx > 0){
                            for(let i = 0; i < depth; i++){
                                let removed = paths.pop()
                                log.emitAll(`\t\t\t${i}/${depth} removing path: ${removed}`)
                            }
                        }
                        log.emitAll(`\t\tadding path: ${_key}`)
                        paths.push(_key)

                        log.emitAll(`\t\tnew paths:`, paths)
                    }

                    switchRecurseTypes(_key, _val)
                })
            }



            
            // isArray - loop
            else if(typeof obj === 'object' && Array.isArray(obj)){
                log.emitAll('\n\n'+`=`.repeat(80))
                log.emitAll(`"${key}" @ "${paths.join('/')}" has type <array>`)
                
                if(key !== 'NESTORE_STORE_ROOT_KEY' && !paths.length){
                    paths.push(key)
                    log.emitAll(`Not root-path and no paths yet, setting path to: ${paths}`)
                }
                
                
                
                obj.forEach((item, idx) => {
                    log.emitAll(`-`.repeat(40))
                    
                    
                    depth = paths.length - 1
                    if(overrideDepth){ depth = overrideDepth }
                    
                    log.emitAll(`IDX    : ${idx}`)
                    log.emitAll(`ITEM   : ${item}`)
                    log.emitAll(`PATH   : ${paths.join('/')}`)
                    log.emitAll(`DEPTH  : ${depth}`)

                        
                    if(idx > 0){
                        for(let i = 0; i < depth; i++){
                            let removed = paths.pop()
                            log.emitAll(`\tremoving path: ${removed}`)
                        }
                    }
                    
                    log.emitAll(`\tadding path: ${idx}  =>  ${paths.join('/')}`)
                    paths.push(idx+'')
                    

                    switchRecurseTypes(idx+'', item, depth)

                })
            }



            // emit
            else{
                // this.#emit(key, this.get(key))
                log.emitAll(`>>>`, paths.length ? paths.join('/') : '/', '>>>', this.get(paths.length ? [...paths].join('.') : key))
                // log.emitAll(`Max depth, getting value and emitting event: ${key}: ${[...paths].join('.')}`)
                this.#emit(key, {
                    key,
                    path: paths.length ? paths.join('/') : '/',
                    value: this.get(paths.length ? [...paths].join('.') : key),
                })
            }
        }
        switchRecurseTypes('NESTORE_STORE_ROOT_KEY', this.internalStore)
    }

    //&                                                                                             
    reset = () => {
        this.internalStore = {...this.originalStore}
        this.#emit('nestore-reset', {
            path: '/',
            key: 'NESTORE_RESET',
            value: this.internalStore
        })
        this.#handleEmitAll()
    }

    get store() { return this.internalStore }

    // return { get, set, store }

}

const NST = (...store:any) => new nestoreClass(...store)


export default NST