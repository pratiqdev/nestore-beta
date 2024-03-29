import EE2 from "eventemitter2";
import { omit, set, get, isEqual, cloneDeep } from 'lodash-es'
import debug from 'debug'
const LOG = debug('nestore')

/* TODO- JSDoc comments 
All public/usable functions, methods, types, values, properties and arguments need to be properly commented with jsDoc 
*/

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const COMMON = {
    NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY',
    // DOCS- default delimiter char / disallowed chars
    DEFAULT_DELIMITER_CHAR: '.',
    DISALLOWED_DELIMITER_CHARS: [
        '@',
        '$',
        '-',
        '=',
        '_',
    ]
}
 
// TODO! generate types before next npm publish!!!!!!
  

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/** Nestore Class
 * @param initialStore - NST
 * @returns NSTInstance - instance of Nestore NSTInstance
 */
class Nestore<T> extends EE2{
    
    #INTERNAL_STORE: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #STORE_MUTATORS: string[];
    #STORE_LISTENERS: string[];
    #PREVENT_REPEAT_UPDATE: boolean;
    #DEV_EXTENSION: null | NSTDevExt;
    adapters: { [key:string]: NSTAdapterFunctions };



    constructor(initialStore: T | Partial<T> = {}, options: NSTOptions = {}){
        super(options)

        const _log = LOG.extend('constr')
        _log('Creating store:', {
            initialStore,
            options,
        })


        this.#INTERNAL_STORE = {}
        this.#ORIGINAL_STORE = {}
        this.#DELIMITER_CHAR = ''   
        this.#STORE_MUTATORS = []
        this.#STORE_LISTENERS = []
        this.#PREVENT_REPEAT_UPDATE = true
        this.#DEV_EXTENSION = null
        this.adapters = {};

     


        this.#PREVENT_REPEAT_UPDATE = options?.preventRepeatUpdates ?? false
        // this.#INTERNAL_STORE = storeOmitted
        // this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted))
        this.#ORIGINAL_STORE = initialStore ?? {}
        this.#DELIMITER_CHAR = options.delimiter ?? '.'



        //! remove this and test again! I think this was just used when "this" was undefined
        //! in the registerAdapter function
        this.registerAdapter.bind(this);
            
        // this.registerDevTools()
        LOG('Store created:', initialStore)
            

    }



    //_                                                                                             
    /** Should not be provided to user */
    registerStore = () => {
        const _log = LOG.extend('register-store')
        _log('initialStore:', this.#ORIGINAL_STORE)
        this.#ORIGINAL_STORE && Object.entries(this.#ORIGINAL_STORE).forEach(([ key, val ]) => {
            if(typeof val === 'function' && typeof this !== 'undefined'){
                if(key.startsWith('$')){
                    this.#STORE_LISTENERS.push(key)
                    const path = key.substring(1, key.length)
                    this.on(path, (event) => val(this, event))
                    
                }else{
                    this.#STORE_MUTATORS.push(key)
                    set(this, key, (...args:unknown[]) => val(this, args))
                }
            }
        })

        const storeOmitted:Partial<T> = Object.fromEntries(
            Object.entries(this.#ORIGINAL_STORE as NSTStore)
            .filter(([KEY]: [string, unknown]) => 
                !this.#STORE_MUTATORS.includes(KEY) 
                && !this.#STORE_LISTENERS.includes(KEY) )
        ) as Partial<T>

        
        this.#INTERNAL_STORE = { ...storeOmitted } 
        this.#ORIGINAL_STORE = cloneDeep(storeOmitted)
        
        _log('Omitted items from store:', {
            internal: this.#INTERNAL_STORE,
            original: this.#ORIGINAL_STORE
        })

    }
    



    
    //_                                                                                             
    /** dev tools requires active instance of Nestore to be registered */
    /* DOCS- devTools registration
    user can defer register dev tools by setting false, and invoking
    later */
    registerDevTools = async (): Promise<boolean> => {
        const _log = LOG.extend('devtool')
        try{
            if(typeof window !== 'undefined'){
                _log(`Browser mode`)
                
                const W: typeof globalThis & Window & {'__REDUX_DEVTOOLS_EXTENSION__': { connect: () => NSTDevExt }} 
                = window as typeof globalThis & Window & {'__REDUX_DEVTOOLS_EXTENSION__': { connect: () => NSTDevExt }}

                if(typeof W['__REDUX_DEVTOOLS_EXTENSION__'] && typeof W['__REDUX_DEVTOOLS_EXTENSION__'] !== 'undefined'){
                    // log(`Found window and devTools`)
                    try{
                        const devExtensionConnector: { connect: () => NSTDevExt } =  W['__REDUX_DEVTOOLS_EXTENSION__']
                        let devExtension:NSTDevExt
                        if (devExtensionConnector && devExtensionConnector.connect) {
                            devExtension = devExtensionConnector.connect()
                            // log(`Connected to devtools`)
                            
                            devExtension.init(this.#INTERNAL_STORE);
                            // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
                            // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
                            devExtension.subscribe((message: { state?: unknown }) => {
                                console.log('devExtension message:', message)
                                if(message.state){
                                    // pass a flag about the expected behaviour for set
                                    this.set(JSON.parse(message.state as string), null, 'all')
                                }
                            })
                            this.#DEV_EXTENSION = devExtension
                            _log('Devtools registered')
                        }

                    }catch(err){
                        _log(`Devtools error:`, err)
                    }
                }
                return true
            }else{
                _log(`Headless mode`)
                return false
            }
        }catch(err){
            _log('Error registering dev-tools:', err)
            return false
        }
    }


      //_                                                                                             
    // Could this be refactored into a function that only works on a single adapter
    // so that the constructor can call this repeatedly on the array of adapters, or the user
    // can register a single adapter at any time
    // DOCS- register an adapter at any time with registerAdapter(NSTAdapter) | registerAdapter(() => NSTAdapterGenerator({ ... }))
    registerAdapter = async (adapter: NSTAdapter) => {
        const _log = LOG.extend('register-adapter')
        !this && _log('Attempted to register adapter with no self reference (no "this"):', this)
        try{

            const adpt = await adapter(this)
            if(
                !adpt
                || typeof adpt.namespace !== 'string'
                || typeof adpt.load !== 'function'
                || typeof adpt.save !== 'function'
            ){
                throw new Error(`Adapter (${adapter}) failed to register.`)
            }
            this.adapters[adpt.namespace] = adpt
            _log('Adapter registered:', adpt.namespace)
            return true
            
        }catch(err){
            throw new Error(err as string)
        }
 
    }
    
    
    //_                                                                                             
    // DOCS- emit method from ee2 (#emit is private)
    #emit(args:NSTEmit) {
        // const log = console.log
        const _log = LOG.extend('emit')
        args.path = this.#convertStringOrArrayToNormalizedPathString(args.path)
        _log(`>> Emitting  "${args.path}" =>`, args.value)
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
        const _log = LOG.extend('emit-all')
        _log('Parsing store to emit events for every key...')
        _log(this.store)

        const emitted:string[] = []

        const visitNodes = (obj:Partial<NSTStore>, visitor: (path:string, value: unknown) => unknown, stack:unknown[] = []) => {
            if (typeof obj === 'object') {
              for (const key in obj) {
                visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
                visitNodes(obj[key] as Partial<NSTStore>, visitor, [...stack, key]);
              }
            } else {
              visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
            }
        }

        visitNodes(this.store, (_path:string, value:unknown) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            const split = this.#splitPathStringAtKnownDelimiters(_path)
            .filter(x => x.trim() !== '')
            
            const key = split[split.length - 1] ?? '/'
            const path = split.length ? split.join(this.#DELIMITER_CHAR) : '/'


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
        const _log = LOG.extend('normPath')
        
        // log.norm(`\nbefore : ${path}`)
        if(Array.isArray(path)){
            _log(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`)
            path = path.join(this.#DELIMITER_CHAR)
        }

        if(path.trim() === '' || path.trim() === '/'){
            return '/'
        }

        const split = this.#splitPathStringAtKnownDelimiters(path)
        const _path:string = split.join(this.#DELIMITER_CHAR)
        // log.norm(`Normalized path: ${path} => ${_path}`)
        
        return _path
    }

    //_                                                                                             
    #splitPathStringAtKnownDelimiters(path:string){
       return path.split(/\[|\]\[|\]\.|\.|\]|\//g)
    }

    //_                                                                                             
    #getLastKeyFromPathString(path:string){
        const split = this.#splitPathStringAtKnownDelimiters(path)
        return split[split.length - 1]
    }

    


    //~ Should change set flags to 0 none | 1 emit (default) | 2 all 
    //&                                                                                             
    set = (path:string | Partial<T>, value?:unknown, flag: NSTEmitFlags = 'emit') => {
        const _log = LOG.extend('set')
        _log({
            path,
            value,
            flag,
            pathType: typeof path,
            valueType: typeof value,
            flagType: typeof flag,
        })
        try{
        
            
            if(this.#PREVENT_REPEAT_UPDATE){
                _log('preventRepeatUpdates: true - checking shallow equality...')
                if(typeof path === 'string' && isEqual(  get(this.#INTERNAL_STORE, path),  value  )){
                    _log(`Provided value already matches stored value, skipping...`, {
                        new: value,
                        old: get(this.#INTERNAL_STORE, path),
                    })
                    return false
                }else if(typeof path === 'object' && isEqual(this.store, path)){
                    _log(`Provided newStore already matches store, skipping...`)
                    return false
                }
            }

  
            if(
                (path === void 0 && value === void 0)
                || (path === void 0 && value !== void 0) 
                || (typeof path !== 'object' && value === void 0)
            ){
                _log('Incorrect args for "set()" :', {path, value})
                return false
            } 
            
            
            // set the store directly with an object
            // NST.set({ ...newStore })
            //! Added value function type check - functions are objects duh
            if(typeof path === 'object' && !value){
                _log('path is object')
                const originalValue = this.#INTERNAL_STORE
    
                if(!Array.isArray(path)){
                    _log(`Setting "store" to new store object: "${value}"`)
                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    // this.#INTERNAL_STORE = cloneDeep(path)
                    this.#INTERNAL_STORE = {...path}
                }

                // The devext flag provides a way for the extension to prevent an  infinite loop of 
                // updates when manually altering data in the store
                if(flag === 'all'){
                    _log(`FLAG = "devext" - set new store - handle emit all`)
                    this.#handleEmitAll(true)
                }
                
                if(flag !== 'none') {
                    _log(`FLAG != "quiet" - emit store "/"`)
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,  
                    })
                }else{
                    _log(`FLAG = "quiet" - Setting with no emit (quiet) "/" : "${value}"`)
                }

                if(flag !== 'all' && this.#DEV_EXTENSION){
                    _log(`FLAG != "devext"`)
                    this.#DEV_EXTENSION.send({
                        type: `/: store => newStore`,
                        path: '/',
                        previousValue: originalValue,
                        value: this.store
                    }, this.store)
                }
                return true
            }

            // TEST- nst.set(path, setterFunction)
            if(typeof path === 'string' && typeof value === 'function'){

                // return an active promise that can be awaited
                return (async () => {

                    _log('path is string with setter function')
                    
                    // DOCS- nst.set(path, setterFunction) setter is invoked with value at path
                    const originalValue = this.get(path)
                    const newValue = await value(originalValue)
                    
                    
                    set(this.#INTERNAL_STORE, path, newValue)

                    
                    this.#DEV_EXTENSION
                        && this.#DEV_EXTENSION.send({
                            type: `${path}: "${originalValue}" => "${newValue}"`,
                            previousValue: originalValue,
                            path,
                            value: newValue
                        }, this.store)
                        
                    
                    this.#emit({
                        path,
                        key: this.#getLastKeyFromPathString(path),
                        value: newValue
                        // timestamp: Date.now(),
                        
                    })
                    return true    
                })()
            }

            if(typeof path === 'string' && (typeof value !== 'function' || typeof value !== 'object')){
                _log('path and value are standard set args')


                // log(`Setting "${path}" : "${value}"`)
                const originalValue = this.#DEV_EXTENSION ? this.get(path) : null

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
            }
        }catch(err){
            _log(`Nestore.set() encountered an error:`, err)
            return false
        }

    }

    //&                                                                                             
    get(path?: string | ((store: NSTStore) => unknown)): unknown {
        try{
            const _log = LOG.extend('get')
            if(!path || path === ''){
                _log(`Nullish "path" argument: returning entire store.`)
                return this.store
            }
            _log(`Getting "${path}"`)
            
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
        const _log = LOG.extend('reset')
        
        _log('-'.repeat(60))
        _log(`internal store:`)
        _log(this.#INTERNAL_STORE)
        _log('-'.repeat(60))
        _log(`original store:`)
        _log(this.#ORIGINAL_STORE)
        _log('-'.repeat(60))
    
        if(this.#DEV_EXTENSION){
            this.#DEV_EXTENSION.send({
                type: `/: store => originalStore`,
                path: '/',
                previousValue: this.#INTERNAL_STORE,
                value: this.#ORIGINAL_STORE
            }, this.#ORIGINAL_STORE)
        }

        this.#INTERNAL_STORE = { ...this.#ORIGINAL_STORE }

            

        _log(`reset store:`)
        _log(this.#INTERNAL_STORE)
        _log('-'.repeat(60))
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.#INTERNAL_STORE
        // })
        this.#handleEmitAll()
    }

    //&                                                                                             
    remove = (path: string) => {
        const _log = LOG.extend('remove')
        _log(`Deleting value at path: ${path}`)
        
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
        // BUG - Remove events should ONLY fire an event for the namespace of the key that was removed
        this.#handleEmitAll()
    }

    get store(){
        //~                                             
        // return cloneDeep(this.#INTERNAL_STORE)
        // return {...this.#INTERNAL_STORE}
        return this.#INTERNAL_STORE
    }



    get _delimiter(){
        return this.#DELIMITER_CHAR
    }
    get _dev_extension(){
        return this.#DEV_EXTENSION
    }
    get _internal_store(){
        return this.#INTERNAL_STORE
    }
    get _original_store(){
        return this.#ORIGINAL_STORE
    }
    get _STORE_MUTATORS(){
        return this.#STORE_MUTATORS
    }
    get _STORE_LISTENERS(){
        return this.#STORE_LISTENERS
    }
    get _prevent_repeat_update(){
        return this.#PREVENT_REPEAT_UPDATE
    }
    get _emit(){
        return this.#emit
    }
    get _handleEmitAll(){
        return this.#handleEmitAll
    }
    get _get_last_key_from_path_string(){
        return this.#getLastKeyFromPathString
    }
    get _split_path_string_at_known_delimiters(){
        return this.#splitPathStringAtKnownDelimiters
    }
    get _convert_string_or_array_to_normalized_path_string(){
        return this.#convertStringOrArrayToNormalizedPathString
    }


    

}

// DOCS- list the namespaces used for debug functions in case users or devs have issues (contributing / testing)
// export default Nestore

// DOCS- awaiting async nestore (adapter, mutator and listener registration) to resolve, or nestore '@ready' event

const nestore:NSTFunction = <T>(initialStore: T | Partial<T> = {}, options: NSTOptions = {}, sync?: boolean): NSTInstance | Promise<NSTInstance> => {
    const _log = LOG.extend('creator')
    // return new Promise(async (res, rej) => {
        try{

            // TODO_ reduce as much as possible to ternary and inline statements
            // DOCS- nestore will return existing instance of Nestore

            if(initialStore instanceof Nestore){
                _log('Recieved instance of Nestore as initialStore - returning original instance...')
                // res(initialStore)
                return initialStore
            }
            
            if(typeof initialStore !== 'object' || Array.isArray(initialStore)){
                throw new Error(`Initial store must be an object.`)
            }

            if(typeof options !== 'object' || Array.isArray(options)){
                throw new Error(`Options must be an object.`)
            }


            const defaultOptions =  {
                wildcard: true, // always true
                verbose: true, // always true
                delimiter: '.',
                maxListeners: 0,
                preventRepeatUpdates: false,
                devTools: false,
            }

            if(typeof options.maxListeners === 'number' 
                    && options.maxListeners <= Number.MAX_SAFE_INTEGER
                    && options.maxListeners >= Number.MIN_SAFE_INTEGER
            ){
                defaultOptions.maxListeners = options.maxListeners
                defaultOptions.verbose = true
            }

            if(options.preventRepeatUpdates === true){
                defaultOptions.preventRepeatUpdates = true
            }

            if(typeof options.delimiter === 'string' && options.delimiter.length == 1){
                if(COMMON.DISALLOWED_DELIMITER_CHARS.includes(options.delimiter)){
                    throw new Error(
                        'Delimiter cannot be any of the following characters:'
                        + COMMON.DISALLOWED_DELIMITER_CHARS.join(', ')
                    )
                }else{
                    defaultOptions.delimiter = options.delimiter
                }
            }

            if(options.devTools === true){
                defaultOptions.devTools = true
            }


            
            
            
            if(sync){
                _log('sync: true - returning instance directly')
                const nst = new Nestore(initialStore, defaultOptions)
                _log('Registering store...')
                nst.registerStore()

                if(options?.adapters?.length){
                    _log('Registering adapters...')
                    Promise.all(options.adapters.map(nst.registerAdapter))
                    .then(() => _log('Adapters registered'))
                    .catch((err) => _log('Error registering adapters:', err))
                }
                        
                _log('Registering dev-tools...')
                nst.registerDevTools()

                _log('Deleting "private" methods...')
                //@ts-expect-error cannot delete read-only properties of nst
                delete nst['registerStore']
                        
                return nst
            }

            _log('sync: false - returning promise that resolves with instantiated nst')
            return (async () => {


                
                _log('Creating instance...')
                const nst = new Nestore(initialStore, defaultOptions)
                _log('Instance created:', nst)
                
                _log('Registering store...')
                nst.registerStore()
                
                if(options.adapters && options.adapters.length){
                    _log('Registering adapters...')
                    await Promise.all(options.adapters.map(nst.registerAdapter))
                    _log('Adapters registered')

                }

                        
                _log('Registering dev-tools...')
                await nst.registerDevTools()
                _log('Dev-tools registered')

                _log('Deleting "private" methods...')
                //@ts-expect-error cannot delete read-only properties of nst
                delete nst['registerStore']
                
                _log('Resolving with nst...')
                return nst
                    

            })()


            
        }catch(err){
            // console.log('nestore instantiator function error:', err)
            _log(err)
            throw new Error(err as string)
            // res()
        }
    // })
}










//& ADAPTERS                                                                                         

// DOCS- type: NSTAdapterGenerator (the function that takes config and returns an adapter)
//! EXTERNAL
// eslint-disable-next-line
type NSTAdapterGenerator = <T>(namespace: string, config: any) => NSTAdapter;

// DOCS- type: NSTAdapter (the actual adapter returned by nestore)
//! EXTERNAL - NSTAdapterGenerator => NSTAdapter
type NSTAdapter = <T>(nst: NSTInstance) => Promise<NSTAdapterFunctions>;


// DOCS- type: NSTAdapterFunctions (the object returned by an adapter, used to save/load the store)
/**
 * NST adapters return a set of functions that can be used to interact with the adapter.
 * Adapters can be referenced at `nst.adapters.namespace` and will always contain the namespace property
 * as well as other optional adapter specific properties and methods (most commonly `save` and `load` methods)
*/
//! EXTERNAL - NSTAdapterGenerator => NSTAdapter => NSTAdapterFunctions
type NSTAdapterFunctions = { 
    namespace: string;
    // load: (...args: unknown[]) => Promise<boolean>; 
    // save: (...args: unknown[]) => Promise<boolean>;
    [key:string]: unknown;
}

// DOCS- type: NSTAdapterEmit (the structure of all events emitted by adapters)
/**
 * NST adapters will emit an object containing the action that took place and the store after
 * mutations / updates took place, as well as a timestamp of the event
 */
//! EXTERNAL - NSTAdapterGenerator => NSTAdapter = NSTAdapterEmit
type NSTAdapterEmit = {
    timestamp: number;
    action: string;
    store: NSTStore;
}






//& DEV EXTENSION                                                                                     

type NSTDevExtSubscribeCb = (message: { state?: unknown }) => unknown

type NSTDevExtSendFunction = (data: NSTDevExtSendData, store: NSTStore) => unknown;

type NSTDevExt = {
    init: (store: NSTStore) => unknown;
    subscribe: (callback: NSTDevExtSubscribeCb) => unknown;
    send: NSTDevExtSendFunction;
}

type NSTDevExtSendData = {
    type: string;
    path: string;
    value: unknown;
    previousValue: unknown;
}









//& NST FUNCTION / CLASS / INSTANCE                                                                           

// DOCS- type: NSTFunction (the async function that returns an active instance of Nestore)
/** Async function that parses store and options, instantiates Nestore and resolves with the instance  
 * 
 * @params Object - initialStore - The user generated object containing the state
 * @params NSTOptions - An object containing options used to configure the new Nestore instance
 * 
 * @returns Promise\<NSTInstance> - The current instance of Nestore
*/
type NSTFunction = <T>(initialStore: T | Partial<T>, options: NSTOptions, sync?: boolean) =>  NSTInstance | Promise<NSTInstance>
// type NSTFunction = <T>(initialStore: T | Partial<T>, options: NSTOptions, sync: boolean) => NSTInstance

// function NSTFunction<T>(initialStore: T | Partial<T>, options: NSTOptions, sync: boolean): NSTInstance;

declare const nst: Nestore<unknown>;
type NSTInstance = typeof nst

// DOCS- type: NSTOptions
type NSTOptions = {
    /** The character used to separate / delimit nested paths */
    delimiter?: string;
    maxListeners?: number;
    verbose?: boolean;
    adapters?: NSTAdapter[];
    preventRepeatUpdates?: boolean;
    devTools?: boolean;
}



//& EMIT                                                                                                     

// DOCS- type: NSTEmit (the struct emitted by all nestore events - excluding adapter events)
/** Structure of data object emitted by Nestore events and passed to listeners as the only argument when invoked.
 * `nst.onAny()` listeners will only be invoked with a string of the path that was updated.
 */
type NSTEmit = {
    path: string;
    key: string;
    value?: unknown;
}

// DOCS- type: NSTEmitFlags (flags used in `nst.set(path, value, flag)` for emitting with `nst.#emit()` with adapter/dev-tools/custom behavior - does not affect `nst.emit()` )
/** Flags used to alter the behavior of emitting events when the state is updated.
 * 
 * 'none' - do not emit any events
 * 'emit' - (default) emit event for this path
 * 'all' - recursively emit events for every item in the store
 */
type NSTEmitFlags = 'none' | 'emit' | 'all'


//& STORE / LISTENERS / MUTATORS                                                                            

type NSTStore = { [key:string | number | symbol]: NSTStoreMutator | NSTStoreListener | unknown }


// DOCS- type: NSTStoreMutator (a function in the store that can be invoked thru nestore doThing: (nst, args) => { ... })
/** Custom mutator functions exist in the store and can be invoked to update the state 
 * 
 * @params Nestore<Partial<T>> - this - a reference to the current instance
 * @params unknown[] - 
 * 
 * @returns unknown
*/
type NSTStoreMutator = (nst: NSTInstance, ...args: unknown[]) => unknown;

// DOCS- type: NSTStoreListener (a function that is registered as a listener by name: $name: ()=>{})
type NSTStoreListener = (nst: NSTInstance, event: NSTEmit) => unknown





export default nestore