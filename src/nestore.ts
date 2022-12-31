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
 

  



//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/** Nestore | Dec 19, 2:41 PM */
class Nestore<T> extends EE2{
    
    #INTERNAL_STORE: Partial<T>; 
    #ORIGINAL_STORE: Partial<T>;
    #DELIMITER_CHAR: string;
    #STORE_MUTATORS: string[];
    #STORE_LISTENERS: string[];
    #PREVENT_REPEAT_UPDATE: boolean;
    #DEV_EXTENSION: any;
    adapters: { [key:string]: NSTAdapterFunctions };



    constructor(initialStore: T | Partial<T> = {}, options: NSTOptions = {}){
        // super({
        //     // TODO- Wildcard should always be true 
        //     wildcard: options?.wildcard === false ? false : true,
        //     // TODO- Delimiter should always be '.' 
        //     //! If delimiter is customizable - must be passed to adapters for custom namespace events: 
        //     //! `@.mongo.saving` => `@-mongo-saving` interferes with hyphenated namespaces...
        //     //! must prevent use of reserved characters:
        //     //! @ (at symbol)- adapters / nestore
        //     //! $ (dollar sign) - in store listeners
        //     //! - (hyphen) - used for adapter namespaces / storage keys
        //     delimiter: typeof options?.delimiter === 'string' ? options?.delimiter : '.',
        //     // TODO- verboseMemoryLeak SHOULD be true by default 
        //     verboseMemoryLeak: options?.verbose === true ? true : false,

        //     maxListeners: typeof options?.maxListeners === 'number' 
        //         && options?.maxListeners <= Number.MAX_SAFE_INTEGER
        //         && options?.maxListeners >= Number.MIN_SAFE_INTEGER
        //             ? options?.maxListeners
        //             : 10
        // })
        super(options)

        let _log = LOG.extend('constr')
        // console.log('>> NESTORE V4')
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

        // TODO+ Move instance check to nestore function 
        // TODO  Add docs: options are not modified when returning the same instance 
        // This could take place before the class is instantiated
        // if(initialStore instanceof Nestore){
        //     this.emit('@ready', initialStore.store)
        //     return initialStore
        // }
        
        // TODO+ Move initialStore typecheck to nestore function 
        // if(typeof initialStore !== 'object' || Array.isArray(initialStore)){
        //     throw new Error(`Initial store must be an object or map.`)
        // }
        
        // TODO+ - Nestore class omitting initialStore items before omitable items are accumulated
        // Omitting items from the store and setting this.#INTERNAL_STORE needs to occur after 
        // this.registerInStoreListeners() - registering listeners and mutators accumulates arrays of 
        // these items, which are then used to filter and omit items from the store (the store returned to user)
        // let storeOmitted:Partial<T> = Object.fromEntries(
        //     Object.entries(initialStore as Object)
        //     .filter(([KEY,VAL]:any) => 
        //         !this.#STORE_MUTATORS.includes(KEY) 
        //         && !this.#STORE_LISTENERS.includes(KEY) )
        // ) as Partial<T>


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
            

        // TODO+ hacky - look for real method of awaiting class instantiation
        // added setTimeout to wait for instantiation before passing self reference to adapters
                
        // let checkForEmit = () => {
        //     setTimeout(() => {
        //         if(typeof this.emit === 'function'){
        //             this.registerInStoreListeners(initialStore)
        //             this.registerAdapters(options)
        //         }else{
        //             checkForEmit()
        //         }
        //     }, 10);
        // }

        // checkForEmit()
    }

    /** @deprecated */
    #initComplete(){
        LOG('Nestore ready!')
        LOG({
            delimiter: this.#DELIMITER_CHAR,
            preventRepeatUpdates: this.#PREVENT_REPEAT_UPDATE,
            maxListeners: this.getMaxListeners(),
            devExtension: this.#DEV_EXTENSION,

            inStoreSetters: this.#STORE_MUTATORS,
            storeSetters: this.#STORE_MUTATORS,
            storeListeners: this.#STORE_LISTENERS,
            
            storeData: this.#INTERNAL_STORE,
        }) 
        this.emit('@ready', this.#INTERNAL_STORE)
        
    }


    //_                                                                                             
    /** Should not be provided to user */
    registerStore() {
        const _log = LOG.extend('register-store')
        _log('initialStore:', this.#ORIGINAL_STORE)
        this.#ORIGINAL_STORE && Object.entries(this.#ORIGINAL_STORE).forEach(([ key, val ]) => {
            if(typeof val === 'function' && typeof this !== 'undefined'){
                if(key.startsWith('$')){
                    this.#STORE_LISTENERS.push(key)
                    let SETTER: NSTStoreListener = val
                    let path = key.substring(1, key.length)
                    // this.on(path, async (event) => await SETTER(this, event))
                    this.on(path, (event) => SETTER(this, event))
                    
                }else{
                    this.#STORE_MUTATORS.push(key)
                    let SETTER = val as NSTStoreMutator<T>
                    //@ts-ignore
                    // this[key] = async (...args:any) => await SETTER(this, args) 
                    this[key] = (...args:any) => SETTER(this, args) 
                }
            }
        })

        const storeOmitted:Partial<T> = Object.fromEntries(
            Object.entries(this.#ORIGINAL_STORE as Object)
            .filter(([KEY,VAL]:any) => 
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
    



    // //_                                                                                             
    // /** @deprecated - use registerStore */
    // registerInStoreListeners(initialStore:Partial<T>) {
    //     const _log = LOG.extend('register-listeners')
    //     initialStore && Object.entries(initialStore).forEach(([ key, val ]) => {
    //         if(typeof val === 'function' && typeof this !== 'undefined'){
    //             if(key.startsWith('$')){
    //                 this.#STORE_LISTENERS.push(key)
    //                 let SETTER: NSTStoreListener = val
    //                 let path = key.substring(1, key.length)
    //                 // this.on(path, async (event) => await SETTER(this, event))
    //                 this.on(path, (event) => SETTER(this, event))
                    
    //             }else{
    //                 this.#STORE_MUTATORS.push(key)
    //                 let SETTER = val as NSTStoreMutator<T>
    //                 //@ts-ignore
    //                 // this[key] = async (...args:any) => await SETTER(this, args) 
    //                 this[key] = (...args:any) => SETTER(this, args) 
    //             }
    //         }
    //     })
    // }
    
    //_                                                                                             
    /** dev tools requires active instance of Nestore to be registered */
    /* DOCS- devTools registration
    user can defer register dev tools by setting false, and invoking
    later */
    registerDevTools() {
        const _log = LOG.extend('devtool')
        if(typeof window !== 'undefined'){
            _log(`Browser mode`)
            
            let W:any = window
            if(typeof W['__REDUX_DEVTOOLS_EXTENSION__'] && typeof W['__REDUX_DEVTOOLS_EXTENSION__'] !== 'undefined'){
                // log(`Found window and devTools`)
                try{
                    //@ts-ignore
                    let devExtensionConnector:any =  window['__REDUX_DEVTOOLS_EXTENSION__']
                    let devExtension:any
                    if (devExtensionConnector && devExtensionConnector.connect) {
                        devExtension = devExtensionConnector.connect()
                        // log(`Connected to devtools`)
                        
                        devExtension.init(this.#INTERNAL_STORE);
                        // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
                        // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
                        devExtension.subscribe((message: any) => {
                            console.log('devExtension message:', message)
                            if(message.state){
                                // pass a flag about the expected behaviour for set
                                this.set(JSON.parse(message.state), null, 'all')
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
            _log(`Headless mode`)
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

            let adpt = await adapter(this)
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
            let e:any = err
            throw new Error(e!)
        }
 
    }
    

    // //_                                                                                             
    // // Could this be refactored into a function that only works on a single adapter
    // // so that the constructor can call this repeatedly on the array of adapters, or the user
    // // can register a single adapter at any time
    // /** @deprecated - use public singular method: registerAdapter(singleAdapter) */
    // registerAdapters(options: NSTOptions) {
    //     const _log = LOG.extend('register-adapters')

    //     if(!options?.adapters || !options?.adapters.length){
    //         _log('No adapters provided...')
    //         this.#initComplete()
    //         return
    //     }
        
    //     if((!Array.isArray(options?.adapters) || !options?.adapters?.every(a => typeof a === 'function'))){
    //         console.warn(`Nestore adapters must be provided as an array of one or more adapter functions`);
    //         // this.emit('@ready', this.#INTERNAL_STORE)
    //         return false
    //     }
        
        
    //     // _log('awaiting nst.emit...')
    //     // const register = () => {
    //         _log('registering adapters...')

    //         try{
    //             let numRegistered = 0

    //             options?.adapters?.forEach(async (adapter: NSTAdapter, idx:number) => {
    //                 let adpt = await adapter(this)
    //                 if(
    //                     !adpt
    //                     || typeof adpt.namespace !== 'string'
    //                     || typeof adpt.load !== 'function'
    //                     || typeof adpt.save !== 'function'
    //                 ){
    //                     throw new Error(`Adapter (index ${idx}) failed to register.`)
    //                 }
    //                 this.adapters[adpt.namespace] = adpt
    //                 _log('Adapter registered:', adpt.namespace)
    //                 numRegistered++
    //                 if(options?.adapters?.length === numRegistered){
    //                     // _log('All adapters registered:', options.adapters)
    //                     // this.emit('@ready', this.#INTERNAL_STORE)
    //                     this.#initComplete()
    //                     return true
    //                 }

    //             })
                
    //         }catch(err){
    //             let e:any = err
    //             throw new Error(e!)
    //         }
    //     // }

    //     // let count = 0
    //     // let checkForEmit = () => {
    //     //     setTimeout(() => {
    //     //         if(typeof this.emit === 'function'){
    //     //             register()
    //     //         }else{
    //     //             count++
    //     //             checkForEmit()
    //     //         }
    //     //     }, 10);
    //     // }

    //     // checkForEmit()
    // }
    
    
    
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
        const _log = LOG.extend('normPath')
        
        // log.norm(`\nbefore : ${path}`)
        if(Array.isArray(path)){
            _log(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`)
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

    


    //~ Should change set flags to 0 none | 1 emit (default) | 2 all 
    //&                                                                                             
    set = (path:string | Partial<T>, value?:any, flag: NSTEmitFlags = 'emit') => {
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
                (typeof path === 'undefined' && typeof value === 'undefined')
                || (typeof path === 'undefined' && typeof value !== 'undefined') 
                || (typeof path !== 'object' && typeof value === 'undefined')
            ){
                _log('Incorrect args for "set()" :', {path, value})
                return false;  
            } 
            
            
            // set the store directly with an object
            // NST.set({ ...newStore })
            if(typeof path === 'object'){
                let originalValue = this.#INTERNAL_STORE
    
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
            _log(`Nestore.set() encountered an error:`, err)
            return false
        }

    }

    //&                                                                                             
    get(path?: string | Function): any {
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

// export type NSTClass<T = void> = Nestore<T>


// DOCS- list the namespaces used for debug functions in case users or devs have issues (contributing / testing)
// export default Nestore

// DOCS- awaiting async nestore (adapter, mutator and listener registration) to resolve, or nestore '@ready' event
const nestore:NSTFunction = <T>(initialStore: T | Partial<T> = {}, options: NSTOptions = {}): Promise<NSTInstance> => {
    return new Promise(async (res, rej) => {
        try{

            //? Current flow
            //- await nestore function
            //- nestore function instantiates Nestore class
            //- Nestore extends ee2 and invokes super with options
            //- Omit items from store (broken - omits nothing)
            //- attempts to register dev tools
            //- uses timeout loop to check for instantiation completetion - then:
            //- registers in store listeners
            //- loop thru and await register adapters - then set this.adapters[namespace]
            //- if all adapters registered - emit '@ready'

            // const nst = new Nestore(initialStore, options)
            
            // nst.on('@ready', () => {
            //     res(nst)
            // })


 
            //? Updated flow
            //- 1. check for correct types of initialStore and options - return if instance of nestore
            //- 2. parse options and set defaults - options can now be used directly in Nestore class

            //- 3. define util functions:
            //-    - _get_last_key_from_path_string
            //-    - _split_path_string_at_known_delimiters
            //-    - _convert_string_or_array_to_normalized_path_string
            
            //+ x. create instance => const nst = new Nestore(initialStore, parsedOptions)

            //- 4. registerInStoreListeners (requires instance)
            //- 5. registerAdapters (requires instance) - allow user to invoke
            // await Promis.all( options.adapters.map(async () => {
            //     
            // }))
            //- 6. registerDevTools (requires instance) - allow user to invoke
            //- 7. delete registerInStoreListeners


            // //@ts-expect-error
            // delete nst['_get_last_key_from_path_string']

            // TODO_ reduce as much as possible to ternary and inline statements
            // DOCS- nestore will return existing instance of Nestore
            if(initialStore instanceof Nestore){
                res(initialStore)
                return
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


            const _log = LOG.extend('creator')
            
            
            
            
            
            _log('Creating instance...')
            const nst = new Nestore(initialStore, defaultOptions)
            _log('Instance created:', nst)
            
            _log('Registering store...')
            nst.registerStore()
            
            if(options.adapters && options.adapters.length){
                _log('Registering adapters...')
                await Promise.all( 
                    options.adapters.map(nst.registerAdapter)
                )
            }
                
            _log('Registering dev-tools...')
            nst.registerDevTools()

            _log('Deleting "private" methods...')
            //@ts-expect-error
            delete nst['registerStore']
            
            _log('Resolving with nst...')
            res(nst)



            
        }catch(err){
            // console.log('nestore instantiator function error:', err)
            rej(err)
        }
    })
}


export type NSTClass<T = void> = Nestore<T>

const nst = new Nestore()
export type NSTInstance = typeof nst

// DOCS- type: NSTOptions
export type NSTOptions = {
    /** The character used to separate / delimit nested paths */
    delimiter?: string;
    /** @depracated - always true */
    wildcard?: boolean;
    /**
     *  @deprecated
     *  The store and its values will always be de-reffed from the original
     */
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    /** @deprecated - unused */
    throwOnRevert?: boolean;
    // timeout?: number;
    adapters?: NSTAdapter[];
    preventRepeatUpdates?: boolean;
    // enable or disable the use of redux-dev-tools extension
    devTools?: boolean;
}

// DOCS- type: NSTEmit (the struct emitted by all nestore events - excluding adapter events)
export type NSTEmit = {
    path: string;
    key: string;
    value?: any;
}

// DOCS- type: NSTFunction (the async function that returns an active instance of Nestore)
export type NSTFunction = <T>(initialStore: T | Partial<T>, options: NSTOptions) => Promise<NSTInstance>

// DOCS- type: NSTStoreMutator (a function in the store that can be invoked thru nestore doThing: (nst, args) => { ... })
export type NSTStoreMutator<T> = (this: Nestore<Partial<T>>, args?: any[]) => any;

// DOCS- type: NSTStoreListener (a function that is registered as a listener by name: $name: ()=>{})
export type NSTStoreListener = any;

// DOCS- type: NSTAnyStorage (any object that has getItem and setItem method)
export type NSTAnyStorage = {
    getItem: (...args:unknown[]) => unknown;
    setItem: (...args:unknown[]) => unknown;
} 

// DOCS- type: NSTAdapterGenerator (the function that takes config and returns an adapter)
export type NSTAdapterGenerator = <T>(config: any) => NSTAdapter;

// DOCS- type: NSTAdapterFunctions (the object returned by an adapter, used to save/load the store)
export type NSTAdapterFunctions = { 
    namespace: string;
    load: () => Promise<boolean>; 
    save: () => Promise<boolean>;
    disconnect?: () => Promise<any>;
}

// DOCS- type: NSTAdapter (the actual adapter returned by nestore)
export type NSTAdapter = <T>(nst: NSTClass<T>) => Promise<NSTAdapterFunctions>;

// DOCS- type: NSTAdapterEmit (the structure of all events emitted by adapters)
export type NSTAdapterEmit = {
    timestamp: number;
    action: string;
    store: any;
}

// DOCS- type: NSTEmitFlags (flags used in `nst.set(path, value, flag)` for emitting with `nst.#emit()` with adapter/dev-tools/custom behavior - does not affect `nst.emit()` )
export type NSTEmitFlags = 'none' | 'emit' | 'all'


export default nestore