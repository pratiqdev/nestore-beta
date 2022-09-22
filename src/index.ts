import EE2 from "eventemitter2";
import { cloneDeep, omit, set, get } from 'lodash-es'
import { T_NestoreEmit, T_NestoreOptions } from "./interfaces";
import COMMON from "./common.js";
import log from "./log.js";



class Nestore<T> extends EE2{
    
    #INTERNAL_STORE: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #SETTER_FUNCTIONS: string[];
    // #THROW_ON_REVERT: boolean;
    // #ASYNC_SETTER_TIMEOUT: number;


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

        this.#INTERNAL_STORE = {}
        this.#ORIGINAL_STORE = {}
        this.#DELIMITER_CHAR = ''
        this.#SETTER_FUNCTIONS = []
        // this.#THROW_ON_REVERT = options.throwOnRevert === false ? false : true
        // this.#ASYNC_SETTER_TIMEOUT = 2_000

        // if(options.timeout && options.timeout > 0 && options.timeout < (60_000 * 10)){
        //     this.#ASYNC_SETTER_TIMEOUT = options.timeout
        // }

        if(store instanceof Nestore) return store;
        
        
        
        if(typeof store !== 'object' || Array.isArray(store)){
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }
        
        log.constr('='.repeat(80))
        log.constr('NESTORE: Creating store')
        log.constr(store)
        log.constr('='.repeat(80))
        // let that = this



        // async function fulfillWithTimeLimit(timeLimit:number, task:Function, failureValue?:string){
        //     let timeout;
        //     //@ts-ignore
        //     console.log(`>>>>>> IN fulfill with timeout: this:`, typeof this)
        //     console.log(`>>>>>> IN fulfill with timeout: that:`, typeof that)

        //     const timeoutPromise = new Promise((resolve, reject) => {
        //         timeout = setTimeout(() => {
        //             resolve(failureValue);
        //         }, timeLimit);
        //     });
        //     try{
        //         // // console.log('>>> Awaiting race...')
        //         let response = await Promise.race([task, timeoutPromise]);
        //         // // console.log('>>> Race complete')
        //         if(timeout){ //the code works without this but let's be safe and clean up the timeout
        //             clearTimeout(timeout);
        //         }

        //         if(response === failureValue){
        //             if(that.#THROW_ON_REVERT){
        //                 throw new Error(failureValue)
        //             }
        //             console.log(failureValue);
        //             response = false
        //         }

        //         // console.log('>>> Returning response')
        //         return response;
        //     }catch(err){
        //         // // console.log(`>>> race error:`, err)
        //         return err
        //     }
        // }

        // function isPromise(p:any) {
        //     if (typeof p === 'object' && typeof p.then === 'function') {
        //     return true;
        //     }
        
        //     return false;
        // }
        
        // // ✅ Check if return value is promise
        // function returnsPromise(f:any) {
        //     if(f.constructor.name === 'AsyncFunction'){
        //         // console.log('✅ Function returns promise');
        //         return true
        //     }

        //     let funcResult = null

        //     if(typeof f === 'function'){
        //         try{
        //             // @ts-ignore
        //             funcResult = f()
        //             return funcResult
        //         }catch(err){
        //             // // console.log('funcResult err:', err)
        //         }
        //     }

        //     if (funcResult) {
        //         // console.log('✅ Function returns promise');
        //         return true;
        //     }
        
        //     // console.log('⛔️ Function does NOT return promise');
        //     return false;
        // }
        
        
        store && Object.entries(store).forEach(([ key, val ]) => {
            if(typeof val === 'function'){
                this.#SETTER_FUNCTIONS.push(key)
                // console.log(`>>>>>> IN LOOP:`, this)

                //@ts-ignore
                this[key] = (...args:any) => val(this, args)
       
                // let failureValue = 
                //     colors.yellow
                //     + `\nNestore setter error:\n`
                //     // + `-`.repeat(60) + '\n'
                //     +`Setter function "${colors.white + key + colors.yellow}" did not return or resolve within the limit of ${this.#ASYNC_SETTER_TIMEOUT} ms.`
                //     + `\nThe store will reflect any changes that occurred within the time limit.`
                //     + colors.reset
                //     + '\n'
                
                // let isProm = false
                // try{
                //     isProm = returnsPromise(val)
                // }catch(err){
                //     // console.log('prom error;', err)
                // }
                // //@ts-ignore
                // this[key] = isProm
                //     ? (...args:any) => fulfillWithTimeLimit(this.#ASYNC_SETTER_TIMEOUT, val(this, args), failureValue)
                //     : (...args:any) => val(this, args)

            }
        })

        // create deep clones of the store arg to prevent modifications by reference
        // omit all custom setter functions from the store
        this.#INTERNAL_STORE = cloneDeep(omit(store, this.#SETTER_FUNCTIONS))
        this.#ORIGINAL_STORE = cloneDeep(omit(store, this.#SETTER_FUNCTIONS))
        this.#DELIMITER_CHAR = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULT_DELIMITER_CHAR
        
        


        // handle connecting to the redux-devtools browser extension
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
    #emit(args:T_NestoreEmit) {
        args.path = this.#normalizePath(args.path)
        log.emit(`>> Emitting  "${args.path}"`)
        log.emit(args.value)
    
        // this.emit('*', args);
        return this.emit(args.path, args) || this.emit('', args);
    }
    
    //_                                                                                             
    #handleEmitAll(){
        log.emitAll('Parsing store to emit events for every key...')
        log.emitAll(this.store)

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

        visitNodes(this.store, (_path:string, value:any) => {
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
                if(!Array.isArray(path)){
                    this.#INTERNAL_STORE = cloneDeep(path)
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,  
                    })
                }
                
                return true
            }

            
            set(this.#INTERNAL_STORE, path, value)
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
                return this.store
            }
            log.get(`Getting "${path}"`)
            
            if(typeof path === 'function'){
                return path(this.store)
            }

            return get(this.#INTERNAL_STORE, path)

        }catch(err){
            return undefined
        }
    }

    //&                                                                                             
    reset = () => {
        log.reset('-'.repeat(60))
        log.reset(`current store:`)
        log.reset(this.#INTERNAL_STORE)
        log.reset('-'.repeat(60))
        this.#INTERNAL_STORE = this.#ORIGINAL_STORE
        log.reset(`reset store:`)
        log.reset(this.#INTERNAL_STORE)
        log.reset('-'.repeat(60))
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
        this.#INTERNAL_STORE = omit(this.#INTERNAL_STORE, [path])

        this.#emit({
            path,
            key: this.#splitPathToKey(path),
            value: undefined
        })
        this.#handleEmitAll()
    }

    get store(){
        return cloneDeep(this.#INTERNAL_STORE)
    }

}



function NST<T>(store?: T, options?: T_NestoreOptions): Partial<Nestore<T>> {
    return new Nestore<Partial<T>>(store, options)
    // let nst = new Nestore<Partial<T>>(store, options)
    // return omit(nst, nst.#SETTER_FUNCTIONS)
}

export default NST