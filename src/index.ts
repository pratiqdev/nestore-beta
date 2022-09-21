import EE2, { event } from "eventemitter2";
import * as lodash from 'lodash-es'
// import COMMON from "./common.js";
// import { T_EmitStruct, T_NestoreOptions } from "./interfaces";
// import log from './log.js'
import * as _ from 'lodash-es'
import createDebug from 'debug'


/************************************************************************************************ */
export type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
}

/** Structure of all values emitted by eventemitter */
export type T_EmitStruct = {
    path: string;
    key: string;
    value?: any;
}
/************************************************************************************************ */



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const l = createDebug('nestore')
const log = {
    constr: l.extend('constructor'),
    set:    l.extend('set        '),
    get:    l.extend('get        '),
    reset:  l.extend('reset      '),
    emit:   l.extend('emit       '),
    emitAll:l.extend('emitAll    '),
    norm:   l.extend('normPath   '),
    remove: l.extend('remove     '),
    devtool:l.extend('devtool    '),
    call   :l.extend('call       '),
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const BUILT_IN_DIFF = (a:any,b:any) => {
    var r:any = {};
    _.each(a, function(v:any,k:any) {
        if(b[k] === v) return;
        // but what if it returns an empty object? still attach?
        r[k] = _.isObject(v)
                ? BUILT_IN_DIFF(v, b[k])
                : v
            ;
        });
    return r;
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const COMMON = {
    NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY',
    DEFAULT_DELIMITER_CHAR: '.'
}



















class Nestore<T> extends EE2{
    
    #INTERNAL_STORE: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #SETTER_FUNCTIONS: string[];


    constructor(store: T | Partial<T> = {}, options: T_NestoreOptions = {}){
        super({
            wildcard: options.wildcard === false ? false : true,
            delimiter: typeof options.delimiter === 'string' ? options.delimiter : '.',
            verboseMemoryLeak: options.verbose === true ? true : false,
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
        
        // this.#INTERNAL_STORE = lodash.cloneDeep(store)
        // this.#ORIGINAL_STORE = lodash.cloneDeep(store)
        // this.#this = this
        this.#SETTER_FUNCTIONS = []
        
        store && Object.entries(store).forEach(([ key, val ]) => {
            if(typeof val === 'function'){
                this.#SETTER_FUNCTIONS.push(key)
                //@ts-ignore
                this[key] = (...args:any) => val(this, args)
                // this.#set_dynamic_property(key, async (...args:any) => val(this, args))
            }
        })
        
        this.#INTERNAL_STORE = lodash.omit(store, this.#SETTER_FUNCTIONS)
        this.#ORIGINAL_STORE = lodash.omit(store, this.#SETTER_FUNCTIONS)
        this.#DELIMITER_CHAR = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULT_DELIMITER_CHAR
      

        
        
        if(store instanceof Nestore) return store;

        if(typeof window !== 'undefined'){
            let W:any = window
            if(typeof W.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined'){
                log.devtool(`Found window and devTools`)
            }else{
                log.devtool(`Found window with no devTools`)
            }
        }else{
            log.devtool(`Headless mode`)
        }
    }


    //_                                                                                             
    #set_dynamic_property(name:string, value: Function) {
        //@ts-ignore
        this[name] = value;
    }

    //_                                                                                             
    #emit(args:T_EmitStruct) {
        args.path = this.#normalizePath(args.path)
        log.emit(`>> Emitting  "${args.path}"`, args.value)
    
        // this.emit('*', args);
        return this.emit(args.path, args) || this.emit('', args);
    }

    #normalizePath(path:string | string[]){
        // log.norm(`\nbefore : ${path}`)
        if(Array.isArray(path)){
            log.norm(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`)
            path = path.join(this.#DELIMITER_CHAR)
        }

        if(path.trim() === '' || path.trim() === '/'){
            return '/'
        }

        let split = this.#splitPath(path)
        let _path:string = split.join(this.#DELIMITER_CHAR)
        // log.norm(`Normalized path: ${path} => ${_path}`)
        
        return _path
    }

    //_                                                                                             
    #handleEmitAll(){
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

        visitNodes(this.#INTERNAL_STORE, (_path:string, value:any) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPath(_path)
            .filter(x => x.trim() !== '')
            
            let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join(this.#DELIMITER_CHAR) : '/'


            if(!emitted.includes(path)){
                emitted.push(path)
                
                this.#emit({
                    path,
                    key,
                    value,
                })
            }

        });
          
    }

    //_                                                                                             
    #splitPath(path:string){
       return path.split(/\[|\]\[|\]\.|\.|\]|\//g)
    }

    //_                                                                                             
    #splitPathToKey(path:string){
        let split = this.#splitPath(path)
        return split[split.length - 1]
    }





    //&                                                                                             
    set = (path:string | Partial<T>, value?:any) => {
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
                    lodash.set(this.#INTERNAL_STORE, path, value)
                }else{
                    this.#INTERNAL_STORE = path
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.#INTERNAL_STORE,
                    })
                }
                
                return true
            }

            
            lodash.set(this.#INTERNAL_STORE, path, value)
            this.#emit({
                path,
                key: this.#splitPathToKey(path),
                value,
            })
            return true
        }catch(err){
            return false
        }

    }

    //&                                                                                             
    get(path?: string | Function): any {
        try{
            if(!path || path === ''){
                log.get(`Nullish "path" argument: returning entire store.`)
                return this.#INTERNAL_STORE
            }
            log.get(`Getting "${path}"`)
            
            if(typeof path === 'function'){
                return path(this.#INTERNAL_STORE)
            }

            return lodash.get(this.#INTERNAL_STORE, path)

        }catch(err){
            return undefined
        }
    }

    //&                                                                                             
    reset = () => {
        this.#INTERNAL_STORE = this.#ORIGINAL_STORE
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.#INTERNAL_STORE
        // })
        this.#handleEmitAll()
    }


    //&                                                                                             
    remove = (path: string) => {
        //! should this delete the key and value from the table or should it set the value to undefined?
        //! this should completely delete the key from the store object
        //! the set() method can set a key to undefined
        this.#INTERNAL_STORE = lodash.omit(this.#INTERNAL_STORE, [path])

        this.#emit({
            path,
            key: this.#splitPathToKey(path),
            value: undefined
        })
        this.#handleEmitAll()
    }

    //&                                                                                             
    // call = (path: string) => {
    //     try{
    //         log.call(`Calling path: "${path}"`)
            
    //         if(path in this.#INTERNAL_STORE && typeof this.#INTERNAL_STORE[path] === 'function'){

                
    //             // call the function at the path provided
    //             let theFunc = this.#INTERNAL_STORE[path]
    //             log.call(`Found func:`, theFunc)
                
    //             // create a deep clone of the store and pass it to the called function
    //             let theSto = lodash.cloneDeep(this.#INTERNAL_STORE)
    //             log.call(`Cloned store:`, theSto)
                
    //             // get the result of the function
    //             let result = theFunc(theSto)

    //             if(typeof result !== 'object'){
    //                 return false;
    //             }


    //             log.call(`Function result:`, result)
                

    //             this.#INTERNAL_STORE = lodash.merge(this.#INTERNAL_STORE, result)
    //         }

    //         this.#emit({
    //             path,
    //             key: path,
    //             value: null
    //         })
    //     }catch(err){
    //         return false
    //     }
    // }




    //+ ____________________________________________________________________________________________                                                                                             
    // /** @deprecated */
    // get paths(){
    //     let PATH_LIST:string[] = []
         
    //     const visitNodes = (obj:any, visitor:any, stack:any[] = []) => {
    //         if (typeof obj === 'object') {
    //           for (let key in obj) {
    //             visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
    //             visitNodes(obj[key], visitor, [...stack, key]);
    //           }
    //         } else {
    //           visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
    //         }
    //     }

    //     visitNodes(this.#INTERNAL_STORE, (_path:string, value:any) => {
    //         // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
    //         let split = this.#splitPath(_path)
    //         .filter(x => x.trim() !== '')
            
    //         // let key = split[split.length - 1] ?? '/'
    //         let path = split.length ? split.join(this.#DELIMITER_CHAR) : '/'


    //         if(!PATH_LIST.includes(path)){
    //             PATH_LIST.push(path)
    //             log.set(`keyCount: Counting key at: ${path}`)
    //         }

    //     });

    //     return PATH_LIST

    // }

   



}

// nestoreClass.prototype.emit



function NST<T>(store?: T, options?: T_NestoreOptions): Partial<Nestore<T>> {
    return new Nestore<Partial<T>>(store, options)
    // let nst = new Nestore<Partial<T>>(store, options)
    // return lodash.omit(nst, nst.#SETTER_FUNCTIONS)
}

export default NST