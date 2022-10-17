import EE2 from "eventemitter2";
import { omit, set, get, isEqual } from 'lodash-es'
import debug from 'debug'
const createLog = (namespace:string) => debug('nestore:' + namespace)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export type T_Nestore<T> = Nestore<Partial<T>>
export type T_NestoreAdapter = <T>(...args:any[]) => T_NestoreAdapterReturn;
export type T_NestoreAdapterReturn = <T>(nestore: T_Nestore<T>) => void;

export type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapter?: T_NestoreAdapterReturn;
    preventRepeatUpdates?: boolean;
}

export type T_NestoreEmit = {
    // timestamp: number;
    path: string;
    key: string;
    value?: any;
}

export type T_AdapterEmit = {
    timestamp: number;
    action: string;
    store: any;
}

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
    
    store: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #SETTER_FUNCTIONS: string[];
    #SETTER_LISTENERS: string[];
    #PREVENT_REPEAT_UPDATE: boolean;
    #DEV_EXTENSION: any;


    constructor(initialStore: T | Partial<T> = {}, options: T_NestoreOptions = {}){
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
        console.log('>> NESTORE V5')
        log('Creating store...')


        this.store = {}
        this.#ORIGINAL_STORE = {}
        this.#DELIMITER_CHAR = ''   
        this.#SETTER_FUNCTIONS = []
        this.#SETTER_LISTENERS = []
        this.#PREVENT_REPEAT_UPDATE = true
        this.#DEV_EXTENSION = null

        if(initialStore instanceof Nestore) return initialStore;

        
        
        if(typeof initialStore !== 'object' || Array.isArray(initialStore)){
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }
        
        type T_CustomMutator = (this: T_Nestore<T>, args?: any[]) => any;
        type T_ListenerMutator = any;
        
        initialStore && Object.entries(initialStore).forEach(([ key, val ]) => {
            if(typeof val === 'function'){
                if(key.startsWith('$')){
                    this.#SETTER_LISTENERS.push(key)
                    let SETTER: T_ListenerMutator = val
                    let path = key.substring(1, key.length)
                    this.on(path, (event) => SETTER(this, event))

                }else{
                    this.#SETTER_FUNCTIONS.push(key)
                    let SETTER: T_CustomMutator = val
                    // this[key] = (...args:any) => SETTER(this, args)
                    let newStruct = {
                        loading: this.#adapter_loadingData,
                        loaded: this.#adapter_loadedData,
                        saving: this.#adapter_savingData,
                        saved: this.#adapter_savedData,
                        registered: this.#adapter_registered,
                        error: this.#adapter_error,
                        store: this.store,
                        onUpdate: this.onAny
                    }
                    //@ts-ignore
                    this[key] = (...args:any) => SETTER(newStruct, args) 

                }
            }
        })

  

        let storeOmitted:Partial<T> = Object.fromEntries(Object.entries(initialStore).filter(([KEY,VAL]:any) => !this.#SETTER_FUNCTIONS.includes(KEY) && !this.#SETTER_LISTENERS.includes(KEY) )) as Partial<T>


        this.#PREVENT_REPEAT_UPDATE = options.preventRepeatUpdates === false ? false : true
        this.store = storeOmitted
        this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted))
        this.#DELIMITER_CHAR = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULT_DELIMITER_CHAR
        

        // handle connecting to the redux-devtools browser extension
        if(typeof window !== 'undefined'){
            const _log = createLog('devtool')
            log(`Browser mode`)

            let W:any = window
            if(typeof W['__REDUX_DEVTOOLS_EXTENSION__'] !== 'undefined'){
                // log(`Found window and devTools`)
                try{
                    //@ts-ignore
                    let extensionConnector:any =  window['__REDUX_DEVTOOLS_EXTENSION__']
                    let devext:any
                    if (!extensionConnector) {
                        console.warn('Nestore - Please install/enable Redux devtools extension')
                    }else{
                        devext = extensionConnector.connect()
                        // log(`Connected to devtools`)
                        
                        devext.init(this.store);
                        // devext.send('@@NESTORE_CONNECT', this.store )
                        // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
                        devext.subscribe((message: any) => {
                            console.log('devext message:', message)
                            if(message.state){
                                // pass a flag about the expected behaviour for set
                                this.set(JSON.parse(message.state), null, 'devext')
                            }
                        })
                        this.#DEV_EXTENSION = devext
                        _log('Devtools registered')
                    }

                }catch(err){
                    _log(`Devtools error:`, err)
                }
            }

        }else{
            log(`Headless mode`)
        }

        // log('='.repeat(80))
        log('Store created:', initialStore)
        
        if(typeof options.adapter === 'function'){
            try{
                options.adapter(this)
                log('Adapter registered')
            }catch(err){
                console.log('Error registering adapter:', err)
            }
        }
        
        // log('='.repeat(80))
    }

    #adapter_loadingData(namespace:string){
        this.emit(`@${namespace}.loading`, this.store) 
    }
    #adapter_loadedData(namespace:string, data: Partial<T>){ 
        this.store = data; 
        this.emit(`@${namespace}.loaded`, data) 
    }
    #adapter_savingData(namespace:string){ 
        this.emit(`@${namespace}.saving`, this.store) 
    }
    #adapter_savedData(namespace:string, data: Partial<T>){ 
        this.store = data; 
        this.emit(`@${namespace}.saved`, data) 
    }
    #adapter_error(namespace:string, error: Error){ 
        this.emit(`@${namespace}.error`, error) 
    }
    #adapter_registered(namespace:string){ 
        this.emit(`@${namespace}.regitsered`, namespace) 
    }


    //_                                                                                             
    #emit(args:T_NestoreEmit) {
        // const log = console.log
        const log = createLog('emit')
        args.path = this.#convertStringOrArrayToNormalizedPathString(args.path)
        log(`>> Emitting  "${args.path}" =>`, args.value)
        // if(this.#DEV_EXTENSION){
        //     log('sending state to devtools:', args)
        //     this.#DEV_EXTENSION.send(args.path, this.store)
        // }else{
        //     log(`no dev ext`)
        // }
        return this.emit(args.path, args) || this.emit('', args);
    }
    
    //_                                                                                             
    #handleEmitAll(ignoreRoot?:boolean){
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
                if(ignoreRoot && path === '/') return
                emitted.push(path)

                // this.#DEV_EXTENSION
                // && this.#DEV_EXTENSION.send({
                //     type: `SET: ${path}`,
                //     previousValue: get(ignoreRoot, path),
                //     path,
                //     value,
                // }, this.store)
                
                this.#emit({
                    path,
                    key,
                    value,
                    // timestamp: Date.now()
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
    set = (path:string | Partial<T>, value?:any, quiet?: string) => {
        try{
            const log = createLog('set')
        
            
            if(this.#PREVENT_REPEAT_UPDATE){
                if(typeof path === 'string' && isEqual(  get(this.store, path),  value  )){
                    log(`Provided value already matches stored value, skipping...`)
                    log({
                        new: value,
                        old: get(this.store, path),
                    })
                    return false
                }else if(typeof path === 'object' && isEqual(this.store, path)){
                    log(`Provided newStore already matches store, skipping...`)
                    return false
                }
            }

  
            if(
                (typeof path === 'undefined' && typeof value === 'undefined')
                || (typeof path === 'undefined' && typeof value !== 'undefined') 
                || (typeof path !== 'object' && typeof value === 'undefined')
            ){
                log('Incorrect args for "set()" :', {path, value})
                return false;  
            } 
            
            
            
            // set the store directly with an object
            // NST.set({ ...newStore })
            if(typeof path === 'object'){
                let originalValue = this.store
    
                if(!Array.isArray(path)){
                    log(`Setting "store" : "${value}"`)
                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    // this.store = cloneDeep(path)
                    this.store = {...path}
                }

                if(quiet === 'devext'){
                    log(`DEVEXT - set new store - handle emit all`)
                    this.#handleEmitAll(true)
                }

                else if(typeof quiet === 'undefined') {
                    log('quiet - nullish - emit "/"')
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,  
                        // timestamp: Date.now(),
                    })
                }else{
                    log(`Setting with no emit "/" : "${value}"`)
                }

                if(quiet !== 'devext'){
                    log('DEVEXT')
                    this.#DEV_EXTENSION
                    && this.#DEV_EXTENSION.send({
                        type: `/: store => newStore`,
                        path: '/',
                        previousValue: originalValue,
                        value: this.store
                    }, this.store)
                }
                return true
            }

            // log(`Setting "${path}" : "${value}"`)
            let originalValue = this.#DEV_EXTENSION ? this.get(path) : null

            set(this.store, path, value)

            if(this.#DEV_EXTENSION){
                this.#DEV_EXTENSION.send({
                    type: `${path}: "${originalValue}" => "${value}"`,
                    previousValue: originalValue,
                    path,
                    value,
                }, this.store)
            }
                
            
            this.#emit({
                path,
                key: this.#getLastKeyFromPathString(path),
                value,
                // timestamp: Date.now(),

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

            return get(this.store, path)

        }catch(err){
            return undefined
        }
    }

    //&                                                                                             
    reset = () => {
        const log = createLog('reset')
        
        log('-'.repeat(60))
        log(`current store:`)
        log(this.store)
        log('-'.repeat(60))
    
        if(this.#DEV_EXTENSION){
            this.#DEV_EXTENSION.send({
                type: `/: store => originalStore`,
                path: '/',
                previousValue: this.store,
                value: this.#ORIGINAL_STORE
            }, this.#ORIGINAL_STORE)
        }

        this.store = this.#ORIGINAL_STORE

            

        log(`reset store:`)
        log(this.store)
        log('-'.repeat(60))
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.store
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

        let og

        if(this.#DEV_EXTENSION){
            og = this.get(path)
        }
            
        this.store = omit(this.store, [path])

        if(this.#DEV_EXTENSION){
            this.#DEV_EXTENSION.send({
                type: `REMOVE: ${path}`,
                previousValue: og,
                path,
                value: undefined,
            }, this.store)
        }

        this.#emit({
            path,
            key: this.#getLastKeyFromPathString(path),
            value: undefined,
            // timestamp: Date.now(),

        })
        //! Why is this being called here!?
        //! Remove events should ONLY fire an event for the namespace of the key that was removed
        this.#handleEmitAll()
    }

    // get store(){
    //     //~                                             
    //     // return cloneDeep(this.store)
    //     // return {...this.store}
    //     return this.store
    // }

}

function NST<T>(store?: T, options?: T_NestoreOptions): Nestore<Partial<T>> {
    return new Nestore<Partial<T>>(store, options)
    // let nst = new Nestore<Partial<T>>(store, options)
    // return omit(nst, nst.#SETTER_FUNCTIONS)
}

export default NST