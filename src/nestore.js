import EE2 from "eventemitter2";
import { omit, set, get, isEqual } from 'lodash-es';
import debug from 'debug';
const createLog = (namespace) => debug('nestore:' + namespace);
const LOG = debug('nestore');
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const COMMON = {
    NESTORE_ROOKEY: 'NESTORE_STORE_ROOKEY',
    DEFAULT_DELIMITER_CHAR: '.'
};
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
};
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/** Nestore | Dec 19, 2:41 PM */
class Nestore extends EE2 {
    #INTERNAL_STORE;
    #ORIGINAL_STORE;
    #DELIMITER_CHAR;
    #SETTER_FUNCTIONS;
    #SETTER_LISTENERS;
    #PREVENT_REPEAT_UPDATE;
    #DEV_EXTENSION;
    adapters;
    constructor(initialStore = {}, options = {}) {
        super({
            wildcard: options?.wildcard === false ? false : true,
            delimiter: typeof options?.delimiter === 'string' ? options?.delimiter : '.',
            verboseMemoryLeak: options?.verbose === true ? true : false,
            maxListeners: typeof options?.maxListeners === 'number'
                && options?.maxListeners <= Number.MAX_SAFE_INTEGER
                && options?.maxListeners >= Number.MIN_SAFE_INTEGER
                ? options?.maxListeners
                : 10
        });
        let _log = LOG.extend('constr');
        // console.log('>> NESTORE V4')
        _log('Creating store...');
        this.#INTERNAL_STORE = {};
        this.#ORIGINAL_STORE = {};
        this.#DELIMITER_CHAR = '';
        this.#SETTER_FUNCTIONS = [];
        this.#SETTER_LISTENERS = [];
        this.#PREVENT_REPEAT_UPDATE = true;
        this.#DEV_EXTENSION = null;
        this.adapters = {};
        if (initialStore instanceof Nestore)
            return initialStore;
        if (typeof initialStore !== 'object' || Array.isArray(initialStore)) {
            throw new Error(`Initial store must be an object or map.`);
        }
        let storeOmitted = Object.fromEntries(Object.entries(initialStore)
            .filter(([KEY, VAL]) => !this.#SETTER_FUNCTIONS.includes(KEY)
            && !this.#SETTER_LISTENERS.includes(KEY)));
        this.#PREVENT_REPEAT_UPDATE = options?.preventRepeatUpdates === false ? false : true;
        this.#INTERNAL_STORE = storeOmitted;
        this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted));
        this.#DELIMITER_CHAR = typeof options?.delimiter === 'string'
            ? options?.delimiter
            : COMMON.DEFAULT_DELIMITER_CHAR;
        this.#registerDevTools();
        LOG('Store created:', initialStore);
        //~ hacky - look for real method of awaiting class instantiation
        //~ added setTimeout to wait for instantiation before passing self reference to adapters
        // setTimeout(() => {
        //     this.#registerAdapters(options)
        // }, 10);
        let checkForEmit = () => {
            setTimeout(() => {
                if (typeof this.emit === 'function') {
                    this.#registerInStoreListeners(initialStore);
                    this.#registerAdapters(options);
                }
                else {
                    checkForEmit();
                }
            }, 10);
        };
        checkForEmit();
    }
    #initComplete() {
        LOG('Nestore ready!');
        LOG({
            delimiter: this.#DELIMITER_CHAR,
            preventRepeatUpdates: this.#PREVENT_REPEAT_UPDATE,
            maxListeners: this.getMaxListeners(),
            devExtension: this.#DEV_EXTENSION,
            inStoreSetters: this.#SETTER_FUNCTIONS,
            storeSetters: this.#SETTER_FUNCTIONS,
            storeListeners: this.#SETTER_LISTENERS,
            storeData: this.#INTERNAL_STORE,
        });
        this.emit('@ready', this.#INTERNAL_STORE);
    }
    //_                                                                                             
    #registerInStoreListeners(initialStore) {
        initialStore && Object.entries(initialStore).forEach(([key, val]) => {
            if (typeof val === 'function' && typeof this !== 'undefined') {
                if (key.startsWith('$')) {
                    this.#SETTER_LISTENERS.push(key);
                    let SETTER = val;
                    let path = key.substring(1, key.length);
                    this.on(path, async (event) => await SETTER(this, event));
                }
                else {
                    this.#SETTER_FUNCTIONS.push(key);
                    let SETTER = val;
                    //@ts-ignore
                    this[key] = async (...args) => await SETTER(this, args);
                }
            }
        });
    }
    //_                                                                                             
    #registerDevTools() {
        const _log = LOG.extend('devtool');
        if (typeof window !== 'undefined') {
            _log(`Browser mode`);
            let W = window;
            if (typeof W['__REDUX_DEVTOOLS_EXTENSION__'] && typeof W['__REDUX_DEVTOOLS_EXTENSION__'] !== 'undefined') {
                // log(`Found window and devTools`)
                try {
                    //@ts-ignore
                    let devExtensionConnector = window['__REDUX_DEVTOOLS_EXTENSION__'];
                    let devExtension;
                    if (devExtensionConnector && devExtensionConnector.connect) {
                        devExtension = devExtensionConnector.connect();
                        // log(`Connected to devtools`)
                        devExtension.init(this.#INTERNAL_STORE);
                        // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
                        // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
                        devExtension.subscribe((message) => {
                            console.log('devExtension message:', message);
                            if (message.state) {
                                // pass a flag about the expected behaviour for set
                                this.set(JSON.parse(message.state), null, 'devext');
                            }
                        });
                        this.#DEV_EXTENSION = devExtension;
                        _log('Devtools registered');
                    }
                }
                catch (err) {
                    _log(`Devtools error:`, err);
                }
            }
        }
        else {
            _log(`Headless mode`);
        }
    }
    //_                                                                                             
    #registerAdapters(options) {
        const _log = LOG.extend('register-adapters');
        if (!options?.adapters || !options?.adapters.length) {
            _log('No adapters provided...');
            this.#initComplete();
            return;
        }
        if ((!Array.isArray(options?.adapters) || !options?.adapters?.every(a => typeof a === 'function'))) {
            console.warn(`Nestore adapters must be provided as an array of one or more adapter functions`);
            // this.emit('@ready', this.#INTERNAL_STORE)
            return false;
        }
        // _log('awaiting nst.emit...')
        // const register = () => {
        _log('registering adapters...');
        try {
            let numRegistered = 0;
            options?.adapters?.forEach(async (adapter, idx) => {
                let adpt = await adapter(this);
                if (!adpt
                    || typeof adpt.namespace !== 'string'
                    || typeof adpt.load !== 'function'
                    || typeof adpt.save !== 'function') {
                    throw new Error(`Adapter (index ${idx}) failed to register.`);
                }
                this.adapters[adpt.namespace] = adpt;
                _log('Adapter registered:', adpt.namespace);
                numRegistered++;
                if (options?.adapters?.length === numRegistered) {
                    // _log('All adapters registered:', options.adapters)
                    // this.emit('@ready', this.#INTERNAL_STORE)
                    this.#initComplete();
                    return true;
                }
            });
        }
        catch (err) {
            let e = err;
            throw new Error(e);
        }
        // }
        // let count = 0
        // let checkForEmit = () => {
        //     setTimeout(() => {
        //         if(typeof this.emit === 'function'){
        //             register()
        //         }else{
        //             count++
        //             checkForEmit()
        //         }
        //     }, 10);
        // }
        // checkForEmit()
    }
    //_                                                                                             
    #emit(args) {
        // const log = console.log
        const _log = LOG.extend('emit');
        args.path = this.#convertStringOrArrayToNormalizedPathString(args.path);
        _log(`>> Emitting  "${args.path}" =>`, args.value);
        // if(this.#DEV_EXTENSION){
        //     log('sending state to devtools:', args)
        //     this.#DEV_EXTENSION.send(args.path, this.#INTERNAL_STORE)
        // }else{
        //     log(`no dev ext`)
        // }
        return this.emit(args.path, args) || this.emit('', args);
    }
    //_                                                                                             
    #handleEmitAll(ignoreRoot) {
        const _log = LOG.extend('emit-all');
        _log('Parsing store to emit events for every key...');
        _log(this.store);
        let emitted = [];
        const visitNodes = (obj, visitor, stack = []) => {
            if (typeof obj === 'object') {
                for (let key in obj) {
                    visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
                    visitNodes(obj[key], visitor, [...stack, key]);
                }
            }
            else {
                visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj);
            }
        };
        visitNodes(this.store, (_path, value) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPathStringAtKnownDelimiters(_path)
                .filter(x => x.trim() !== '');
            let key = split[split.length - 1] ?? '/';
            let path = split.length ? split.join(this.#DELIMITER_CHAR) : '/';
            if (!emitted.includes(path)) {
                if (ignoreRoot && path === '/')
                    return;
                emitted.push(path);
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
                });
            }
        });
    }
    //_                                                                                             
    #convertStringOrArrayToNormalizedPathString(path) {
        const _log = LOG.extend('normPath');
        // log.norm(`\nbefore : ${path}`)
        if (Array.isArray(path)) {
            _log(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`);
            path = path.join(this.#DELIMITER_CHAR);
        }
        if (path.trim() === '' || path.trim() === '/') {
            return '/';
        }
        let split = this.#splitPathStringAtKnownDelimiters(path);
        let _path = split.join(this.#DELIMITER_CHAR);
        // log.norm(`Normalized path: ${path} => ${_path}`)
        return _path;
    }
    //_                                                                                             
    #splitPathStringAtKnownDelimiters(path) {
        return path.split(/\[|\]\[|\]\.|\.|\]|\//g);
    }
    //_                                                                                             
    #getLastKeyFromPathString(path) {
        let split = this.#splitPathStringAtKnownDelimiters(path);
        return split[split.length - 1];
    }
    //~ Should change set flags to 'emit' (default) | 'emit-all' | 'none'
    //&                                                                                             
    set = (path, value, flag) => {
        const _log = LOG.extend('set');
        _log({
            path,
            value,
            flag,
            pathType: typeof path,
            valueType: typeof value,
            flagType: typeof flag,
        });
        try {
            if (this.#PREVENT_REPEAT_UPDATE) {
                if (typeof path === 'string' && isEqual(get(this.#INTERNAL_STORE, path), value)) {
                    _log(`Provided value already matches stored value, skipping...`, {
                        new: value,
                        old: get(this.#INTERNAL_STORE, path),
                    });
                    return false;
                }
                else if (typeof path === 'object' && isEqual(this.store, path)) {
                    _log(`Provided newStore already matches store, skipping...`);
                    return false;
                }
            }
            if ((typeof path === 'undefined' && typeof value === 'undefined')
                || (typeof path === 'undefined' && typeof value !== 'undefined')
                || (typeof path !== 'object' && typeof value === 'undefined')) {
                _log('Incorrect args for "set()" :', { path, value });
                return false;
            }
            // set the store directly with an object
            // NST.set({ ...newStore })
            if (typeof path === 'object') {
                let originalValue = this.#INTERNAL_STORE;
                if (!Array.isArray(path)) {
                    _log(`Setting "store" to new store object: "${value}"`);
                    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                    // this.#INTERNAL_STORE = cloneDeep(path)
                    this.#INTERNAL_STORE = { ...path };
                }
                // The devext flag provides a way for the extension to prevent an  infinite loop of 
                // updates when manually altering data in the store
                if (flag === 'devext') {
                    _log(`FLAG = "devext" - set new store - handle emit all`);
                    this.#handleEmitAll(true);
                }
                if (flag !== 'quiet') {
                    _log(`FLAG != "quiet" - emit store "/"`);
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,
                    });
                }
                else {
                    _log(`FLAG = "quiet" - Setting with no emit (quiet) "/" : "${value}"`);
                }
                if (flag !== 'devext' && this.#DEV_EXTENSION) {
                    _log(`FLAG != "devext"`);
                    this.#DEV_EXTENSION.send({
                        type: `/: store => newStore`,
                        path: '/',
                        previousValue: originalValue,
                        value: this.store
                    }, this.store);
                }
                return true;
            }
            // log(`Setting "${path}" : "${value}"`)
            let originalValue = this.#DEV_EXTENSION ? this.get(path) : null;
            set(this.#INTERNAL_STORE, path, value);
            this.#DEV_EXTENSION
                && this.#DEV_EXTENSION.send({
                    type: `${path}: "${originalValue}" => "${value}"`,
                    previousValue: originalValue,
                    path,
                    value,
                }, this.store);
            this.#emit({
                path,
                key: this.#getLastKeyFromPathString(path),
                value,
                // timestamp: Date.now(),
            });
            return true;
        }
        catch (err) {
            _log(`Nestore.set() encountered an error:`, err);
            return false;
        }
    };
    //&                                                                                             
    get(path) {
        try {
            const _log = LOG.extend('get');
            if (!path || path === '') {
                _log(`Nullish "path" argument: returning entire store.`);
                return this.store;
            }
            _log(`Getting "${path}"`);
            if (typeof path === 'function') {
                return path(this.store);
            }
            return get(this.#INTERNAL_STORE, path);
        }
        catch (err) {
            return undefined;
        }
    }
    //&                                                                                             
    reset = () => {
        const _log = LOG.extend('reset');
        _log('-'.repeat(60));
        _log(`current store:`);
        _log(this.#INTERNAL_STORE);
        _log('-'.repeat(60));
        if (this.#DEV_EXTENSION) {
            this.#DEV_EXTENSION.send({
                type: `/: store => originalStore`,
                path: '/',
                previousValue: this.#INTERNAL_STORE,
                value: this.#ORIGINAL_STORE
            }, this.#ORIGINAL_STORE);
        }
        this.#INTERNAL_STORE = this.#ORIGINAL_STORE;
        _log(`reset store:`);
        _log(this.#INTERNAL_STORE);
        _log('-'.repeat(60));
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.#INTERNAL_STORE
        // })
        this.#handleEmitAll();
    };
    //&                                                                                             
    remove = (path) => {
        const _log = LOG.extend('remove');
        _log(`Deleting value at path: ${path}`);
        //! should this delete the key and value from the table or should it set the value to undefined?
        //! this should completely delete the key from the store object
        //! the set() method can set a key to undefined
        let og;
        if (this.#DEV_EXTENSION) {
            og = this.get(path);
        }
        this.#INTERNAL_STORE = omit(this.#INTERNAL_STORE, [path]);
        if (this.#DEV_EXTENSION) {
            this.#DEV_EXTENSION.send({
                type: `REMOVE: ${path}`,
                previousValue: og,
                path,
                value: undefined,
            }, this.#INTERNAL_STORE);
        }
        this.#emit({
            path,
            key: this.#getLastKeyFromPathString(path),
            value: undefined,
            // timestamp: Date.now(),
        });
        //! Why is this being called here!?
        //! Remove events should ONLY fire an event for the namespace of the key that was removed
        this.#handleEmitAll();
    };
    get store() {
        //~                                             
        // return cloneDeep(this.#INTERNAL_STORE)
        // return {...this.#INTERNAL_STORE}
        return this.#INTERNAL_STORE;
    }
    get _delimiter() {
        return this.#DELIMITER_CHAR;
    }
    get _dev_extension() {
        return this.#DEV_EXTENSION;
    }
    get _internal_store() {
        return this.#INTERNAL_STORE;
    }
    get _original_store() {
        return this.#ORIGINAL_STORE;
    }
    get _setter_functions() {
        return this.#SETTER_FUNCTIONS;
    }
    get _setter_listeners() {
        return this.#SETTER_LISTENERS;
    }
    get _prevent_repeat_update() {
        return this.#PREVENT_REPEAT_UPDATE;
    }
    get _emit() {
        return this.#emit;
    }
    get _handleEmitAll() {
        return this.#handleEmitAll;
    }
    get _get_last_key_from_path_string() {
        return this.#getLastKeyFromPathString;
    }
    get _split_path_string_at_known_delimiters() {
        return this.#splitPathStringAtKnownDelimiters;
    }
    get _convert_string_or_array_to_normalized_path_string() {
        return this.#convertStringOrArrayToNormalizedPathString;
    }
}
const nst = new Nestore();
export default Nestore;
