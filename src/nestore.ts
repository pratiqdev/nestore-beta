import EE2 from "eventemitter2";
import debug from 'debug'
import _ from 'underscore'
import { T_EmitStruct } from "./interfaces";

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
    cc:any;

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

        this.cc = {
            NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY'
        }


        
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
    get = (path?: string | Function) => {
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

        visitNodes(this.internalStore, (_path:string, value:any) => {
            let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            .filter(x => x.trim() !== '')
            
            let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join('/') : '/'


            if(!emitted.includes(path)){
                emitted.push(path)
                
                // log.emitAll(`EMITTING PATH: "${path}"`)
                this.#emit(path, {
                    key,
                    path,
                    value,
                })
            }

        });
          
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

    get keyCount () {
        //! This operations execution duration increases proportionally with 
        //! the total number of keys in the store

        //- t1: 1m keys @ 1045 ms

        
        let start = Date.now()
        let count:number = 0
         
        const visitNodes = (obj:any) => {
            if (typeof obj === 'object') {
              for (let key in obj) {
                visitNodes(obj[key]);
              }
            } else {
                count++
            }
        }

        visitNodes(this.internalStore)
        console.log(`keyCount + ${Date.now() - start} ms`)
        return count
    }

    get store() { return this.internalStore }


}

const NST = (...store:any) => new nestoreClass(...store)


export default NST