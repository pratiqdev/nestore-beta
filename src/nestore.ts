import EE2 from "eventemitter2";
import { omit, set, get, isEqual } from 'lodash-es'
import debug from 'debug'
const createLog = (namespace:string) => debug('nestore:' + namespace)

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export type NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapter?: NestoreAdapterReturn;
    preventRepeatUpdates?: boolean;
}

export type NestoreEmit = {
    // timestamp: number;
    path: string;
    key: string;
    value?: any;
}

export type NestoreFunction = <T>(initialStore?: T, options?: NestoreOptions) => Nestore<Partial<T>>

export type NestoreAdapter = <T>(...args:any[]) => <T>(nestore: Nestore<Partial<T>>) => void;
export type NestoreAdapterReturn = <T>(nestore: Nestore<Partial<T>>) => void;



export type AnyStore = {
    get: (...args:any[]) => any; 
    set: (...args:any[]) => any;
} | {
    getItem: (...args:any[]) => any;
    setItem: (...args:any[]) => any;
} 

export type AdapterEmit = {
    timestamp: number;
    action: string;
    store: any;
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const COMMON = {
    NESTORE_ROOKEY: 'NESTORE_STORE_ROOKEY',
    DEFAULDELIMITER_CHAR: '.'
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
    #SETTER_LISTENERS: string[];
    #PREVENREPEAUPDATE: boolean;
    #DEV_EXTENSION: any;


    constructor(store: T | Partial<T> = {}, options: NestoreOptions = {}){
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
        // console.log('>> NESTORE V4')
        log('Creating store...')


        this.#INTERNAL_STORE = {}
        this.#ORIGINAL_STORE = {}
        this.#DELIMITER_CHAR = ''   
        this.#SETTER_FUNCTIONS = []
        this.#SETTER_LISTENERS = []
        this.#PREVENREPEAUPDATE = true
        this.#DEV_EXTENSION = null

        if(store instanceof Nestore) return store;

        const thing = {
            what: () => {},
            $that: () => {}
        }
        
        
        
        if(typeof store !== 'object' || Array.isArray(store)){
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }
        
        type CustomMutator = (this: Nestore<Partial<T>>, args?: any[]) => any;
        type ListenerMutator = any;
        
        store && Object.entries(store).forEach(([ key, val ]) => {
            if(typeof val === 'function'){
                if(key.startsWith('$')){
                    this.#SETTER_LISTENERS.push(key)
                    let SETTER: ListenerMutator = val
                    let path = key.substring(1, key.length)
                    this.on(path, (event) => SETTER(this, event))

                }else{
                    this.#SETTER_FUNCTIONS.push(key)
                    let SETTER: CustomMutator = val
                    //@ts-ignore
                    this[key] = (...args:any) => SETTER(this, args) 
                }
            }
        })

  

        let storeOmitted:Partial<T> = Object.fromEntries(Object.entries(store).filter(([KEY,VAL]:any) => !this.#SETTER_FUNCTIONS.includes(KEY) && !this.#SETTER_LISTENERS.includes(KEY) )) as Partial<T>


        this.#PREVENREPEAUPDATE = options.preventRepeatUpdates === false ? false : true
        this.#INTERNAL_STORE = storeOmitted
        this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted))
        this.#DELIMITER_CHAR = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULDELIMITER_CHAR
        

        // handle connecting to the redux-devtools browser extension
        if(typeof window !== 'undefined'){
            const _log = createLog('devtool')
            log(`Browser mode`)

            let W:any = window
            if(typeof W['__REDUX_DEVTOOLS_EXTENSION__'] !== 'undefined'){
                // log(`Found window and devTools`)
                try{
                    //@ts-ignore
                    let devExtensionConnector:any =  window['__REDUX_DEVTOOLS_EXTENSION__']
                    let devExtension:any
                    if (!devExtensionConnector) {
                        console.warn('Nestore - Please install/enable Redux devtools extension')
                    }else{
                        devExtension = devExtensionConnector.connect()
                        // log(`Connected to devtools`)
                        
                        devExtension.init(this.#INTERNAL_STORE);
                        // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
                        // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
                        devExtension.subscribe((message: any) => {
                            console.log('devExtension message:', message)
                            if(message.state){
                                // pass a flag about the expected behaviour for set
                                this.set(JSON.parse(message.state), null, 'devext')
                            }
                        })
                        this.#DEV_EXTENSION = devExtension
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
        log('Store created:', store)
        
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



    //_                                                                                             
    #emit(args:NestoreEmit) {
        // const log = console.log
        const log = createLog('emit')
        args.path = this.#convertStringOrArrayToNormalizedPathString(args.path)
        log(`>> Emitting  "${args.path}" =>`, args.value)
        // if(this.#DEV_EXTENSION){
        //     log('sending state to devtools:', args)
        //     this.#DEV_EXTENSION.send(args.path, this.#INTERNAL_STORE)
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
    set = (path:string | Partial<T>, value?:any, flag?: string) => {
        try{
            const log = createLog('set')
        
            
            if(this.#PREVENREPEAUPDATE){
                if(typeof path === 'string' && isEqual(  get(this.#INTERNAL_STORE, path),  value  )){
                    log(`Provided value already matches stored value, skipping...`)
                    log({
                        new: value,
                        old: get(this.#INTERNAL_STORE, path),
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
                let originalValue = this.#INTERNAL_STORE
    
                if(!Array.isArray(path)){
                    log(`Setting "store" : "${value}"`)
                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    // this.#INTERNAL_STORE = cloneDeep(path)
                    this.#INTERNAL_STORE = {...path}
                }

                // The devext flag provides a way for the extension to prevent an  infinite loop of 
                // updates when manually altering data in the store
                if(flag === 'devext'){
                    log(`Set - set new store - handle emit all`)
                    this.#handleEmitAll(true)
                }

                else if(flag !== 'quiet') {
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,  
                        // timestamp: Date.now(),
                    })
                }else{
                    log(`Setting with no emit "/" : "${value}"`)
                }

                if(flag !== 'devext' && this.#DEV_EXTENSION){
                    this.#DEV_EXTENSION.send({
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

            set(this.#INTERNAL_STORE, path, value)

            this.#DEV_EXTENSION
                && this.#DEV_EXTENSION.send({
                    type: `${path}: "${originalValue}" => "${value}"`,
                    previousValue: originalValue,
                    path,
                    value,
                }, this.store)
                
            
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
    
        if(this.#DEV_EXTENSION){
            this.#DEV_EXTENSION.send({
                type: `/: store => originalStore`,
                path: '/',
                previousValue: this.#INTERNAL_STORE,
                value: this.#ORIGINAL_STORE
            }, this.#ORIGINAL_STORE)
        }

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

        let og

        if(this.#DEV_EXTENSION){
            og = this.get(path)
        }
            
        this.#INTERNAL_STORE = omit(this.#INTERNAL_STORE, [path])

        if(this.#DEV_EXTENSION){
            this.#DEV_EXTENSION.send({
                type: `REMOVE: ${path}`,
                previousValue: og,
                path,
                value: undefined,
            }, this.#INTERNAL_STORE)
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

    get store(){
        //~                                             
        // return cloneDeep(this.#INTERNAL_STORE)
        // return {...this.#INTERNAL_STORE}
        return this.#INTERNAL_STORE
    }

}

export type NestoreType = typeof Nestore

export default Nestore