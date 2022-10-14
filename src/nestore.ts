import EE2 from "eventemitter2";
import { omit, set, get, isEqual } from 'lodash-es'
import debug from 'debug'
const createLog = (namespace:string) => debug('nestore:' + namespace)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapter?: T_NestoreAdapter;
    preventRepeatUpdates?: boolean;
}

export type T_NestoreEmit = {
    timestamp: number;
    path: string;
    key: string;
    value?: any;
}

export type T_Nestore<T> = Nestore<Partial<T>>

export type T_NestoreFunction = <T>(initialStore?: T, options?: T_NestoreOptions) => T_Nestore<T>

export type T_NestoreAdapter = <T>(nestore: T_Nestore<T>) => void;


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const COMMON = {
    NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY',
    DEFAULT_DELIMITER_CHAR: '.'
}


const COLORS = {
    reset: '\x1b[0m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    blackBg: '\x1b[40m',
    redBg: '\x1b[41m',
    greenBg: '\x1b[42m',
    yellowBg: '\x1b[43m',
    blueBg: '\x1b[44m',
    magentaBg: '\x1b[45m',
    cyanBg: '\x1b[46m',
    whiteBg: '\x1b[47m'
}








//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/** Nestore? */
class Nestore<T> extends EE2{
    
    #INTERNAL_STORE: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #SETTER_FUNCTIONS: string[];
    #PREVENT_REPEAT_UPDATE: boolean;


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
        const log = createLog('constr')

        this.#INTERNAL_STORE = {}
        this.#ORIGINAL_STORE = {}
        this.#DELIMITER_CHAR = ''
        this.#SETTER_FUNCTIONS = []
        this.#PREVENT_REPEAT_UPDATE = true

        if(store instanceof Nestore) return store;
        
        
        
        if(typeof store !== 'object' || Array.isArray(store)){
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }
        
        
        
        store && Object.entries(store).forEach(([ key, val ]) => {
            if(typeof val === 'function'){
                this.#SETTER_FUNCTIONS.push(key)
                //@ts-ignore
                this[key] = (...args:any) => val(this, args)
            }
        })

  

        let storeOmitted:Partial<T> = Object.fromEntries(Object.entries(store).filter(([KEY,VAL]:any) => !this.#SETTER_FUNCTIONS.includes(KEY) )) as Partial<T>


        this.#PREVENT_REPEAT_UPDATE = options.preventRepeatUpdates === false ? false : true
        this.#INTERNAL_STORE = storeOmitted
        this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted))
        this.#DELIMITER_CHAR = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULT_DELIMITER_CHAR
        

        // handle connecting to the redux-devtools browser extension
        if(typeof window !== 'undefined'){
            const log = createLog('devtool')

            let W:any = window
            if(typeof W.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined'){

                log(`Found window and devTools`)
            }else{
                log(`Found window with no devTools`)
            }
        }else{
            log(`Headless mode`)
        }

        log('='.repeat(80))
        log('>> Store created')
        log(store)
        
        if(typeof options.adapter === 'function'){
            try{
                options.adapter(this)
                log('='.repeat(80))
                log('>> Adapter registered')
            }catch(err){
                console.log('Error registering adapter:', err)
            }
        }
        
        log('='.repeat(80))
    }



    //_                                                                                             
    #emit(args:T_NestoreEmit) {
        const log = createLog('emit')
        args.path = this.#convertStringOrArrayToNormalizedPathString(args.path)
        log(`>> Emitting  "${args.path}"`)
        log(args.value)
        return this.emit(args.path, args) || this.emit('', args);
    }
    
    //_                                                                                             
    #handleEmitAll(){
        const log = createLog('emit-all')
        log('Parsing store to emit events for every key...')
        log(this.store)

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
            let split = this.#splitPathStringAtKnownDelimiters(_path)
            .filter(x => x.trim() !== '')
            
            let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join(this.#DELIMITER_CHAR) : '/'


            if(!emitted.includes(path)){
                emitted.push(path)
                
                this.#emit({
                    path,
                    key,
                    value,
                    timestamp: Date.now()
                })
            }

        });
          
    }

    //_                                                                                             
    #convertStringOrArrayToNormalizedPathString(path:string | string[]){
        const log = createLog('normPath')
        
        // log.norm(`\nbefore : ${path}`)
        if(Array.isArray(path)){
            log(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`)
            path = path.join(this.#DELIMITER_CHAR)
        }

        if(path.trim() === '' || path.trim() === '/'){
            return '/'
        }

        let split = this.#splitPathStringAtKnownDelimiters(path)
        let _path:string = split.join(this.#DELIMITER_CHAR)
        // log.norm(`Normalized path: ${path} => ${_path}`)
        
        return _path
    }

    //_                                                                                             
    #splitPathStringAtKnownDelimiters(path:string){
       return path.split(/\[|\]\[|\]\.|\.|\]|\//g)
    }

    //_                                                                                             
    #getLastKeyFromPathString(path:string){
        let split = this.#splitPathStringAtKnownDelimiters(path)
        return split[split.length - 1]
    }

    


    //&                                                                                             
    set = (path:string | Partial<T>, value?:any, noEmit?: boolean) => {
        try{
            const log = createLog('set')
        
            
            if(this.#PREVENT_REPEAT_UPDATE){
                if(typeof path === 'string' && isEqual(get(this.#INTERNAL_STORE, path), value)){
                    log(`Provided value already matches stored value, skipping...`)
                    return false
                }else if(typeof path === 'object' && isEqual(this.store, path)){
                    log(`Provided newStore already matches store, skipping...`)
                    return false
                }
            }

  
            if(
                (!path && !value)
                || (!path && value) 
                || (typeof path !== 'object' && !value)
            ){
                log('Incorrect args for "set()". Returning false')
                return false;  
            } 
            
            
            
            // set the store directly with an object
            // NST.set({ ...newStore })
            if(typeof path === 'object'){
    
                if(noEmit){
                    log(`Setting with no emit "/" : "${value}"`)

                    this.#INTERNAL_STORE = {...path}
                    return;
                }

                if(!Array.isArray(path)){
                    log(`Setting "store" : "${value}"`)
                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    // this.#INTERNAL_STORE = cloneDeep(path)
                    this.#INTERNAL_STORE = {...path}
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,  
                        timestamp: Date.now(),
                    })
                }
                
                return true
            }else{
                log(`Setting "${path}" : "${value}"`)

            }

            
            set(this.#INTERNAL_STORE, path, value)
            this.#emit({
                path,
                key: this.#getLastKeyFromPathString(path),
                value,
                timestamp: Date.now(),

            })
            return true
        }catch(err){
            return false
        }

    }

    //&                                                                                             
    get(path?: string | Function): any {
        try{
            const log = createLog('get')
            if(!path || path === ''){
                log(`Nullish "path" argument: returning entire store.`)
                return this.store
            }
            log(`Getting "${path}"`)
            
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
        const log = createLog('reset')
        
        log('-'.repeat(60))
        log(`current store:`)
        log(this.#INTERNAL_STORE)
        log('-'.repeat(60))

        this.#INTERNAL_STORE = this.#ORIGINAL_STORE

        log(`reset store:`)
        log(this.#INTERNAL_STORE)
        log('-'.repeat(60))
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.#INTERNAL_STORE
        // })
        this.#handleEmitAll()
    }

    //&                                                                                             
    remove = (path: string) => {
        const log = createLog('remove')
        log(`Deleting value at path: ${path}`)
        
        //! should this delete the key and value from the table or should it set the value to undefined?
        //! this should completely delete the key from the store object
        //! the set() method can set a key to undefined
        this.#INTERNAL_STORE = omit(this.#INTERNAL_STORE, [path])

        this.#emit({
            path,
            key: this.#getLastKeyFromPathString(path),
            value: undefined,
            timestamp: Date.now(),

        })
        //! Why is this being called here!?
        //! Remove events should ONLY fire an event for the namespace of the key that was removed
        this.#handleEmitAll()
    }

    get store(){
        //~                                             
        // return cloneDeep(this.#INTERNAL_STORE)
        return {...this.#INTERNAL_STORE}
    }

}

function NST<T>(store?: T, options?: T_NestoreOptions): Nestore<Partial<T>> {
    return new Nestore<Partial<T>>(store, options)
    // let nst = new Nestore<Partial<T>>(store, options)
    // return omit(nst, nst.#SETTER_FUNCTIONS)
}

export default NST