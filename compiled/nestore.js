import EE2 from "eventemitter2";
import * as lodash from 'lodash-es';
// import COMMON from "./common.js";
// import { T_EmitStruct, T_NestoreOptions } from "./interfaces";
// import log from './log.js'
import * as _ from 'lodash-es';
import createDebug from 'debug';
/************************************************************************************************ */
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const l = createDebug('nestore');
const log = {
    constr: l.extend('constructor'),
    set: l.extend('set        '),
    get: l.extend('get        '),
    reset: l.extend('reset      '),
    emit: l.extend('emit       '),
    emitAll: l.extend('emitAll    '),
    norm: l.extend('normPath   '),
    remove: l.extend('remove     '),
    devtool: l.extend('devtool    '),
};
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const BUILT_IN_DIFF = (a, b) => {
    var r = {};
    _.each(a, function (v, k) {
        if (b[k] === v)
            return;
        // but what if it returns an empty object? still attach?
        r[k] = _.isObject(v)
            ? BUILT_IN_DIFF(v, b[k])
            : v;
    });
    return r;
};
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const COMMON = {
    NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY',
    DEFAULT_DELIMITER: '.'
};
class nestoreClass extends EE2 {
    INTERNAL_STORE;
    ORIGINAL_STORE;
    DELIMITER;
    ALLOW_DIRECT_MOD;
    constructor(store = {}, options = {}) {
        super({
            wildcard: options.wildcard === false ? false : true,
            delimiter: typeof options.delimiter === 'string' ? options.delimiter : '.',
            verboseMemoryLeak: options.verboseMemoryLeak === true ? true : false,
            maxListeners: typeof options.maxListeners === 'number'
                && options.maxListeners <= Number.MAX_SAFE_INTEGER
                && options.maxListeners >= Number.MIN_SAFE_INTEGER
                ? options.maxListeners
                : 10
        });
        log.constr('='.repeat(80));
        log.constr('Creating store');
        if (typeof store !== 'object' || Array.isArray(store)) {
            throw new Error("neStore | Initial store must be of type: object  eg: { myKey: 'myValue' }");
        }
        this.ALLOW_DIRECT_MOD = options.allowDirectModification === true ? true : false;
        this.INTERNAL_STORE = lodash.cloneDeep(store);
        this.ORIGINAL_STORE = lodash.cloneDeep(store);
        this.DELIMITER = typeof options.delimiter === 'string' ? options.delimiter : COMMON.DEFAULT_DELIMITER;
        if (store instanceof nestoreClass) {
            return store;
        }
        if (typeof window !== 'undefined') {
            let W = window;
            if (typeof W.__REDUX_DEVTOOLS_EXTENSION__ !== 'undefined') {
                log.devtool(`Found window and devTools`);
            }
            else {
                log.devtool(`Found window with no devTools`);
            }
        }
        else {
            log.devtool(`Headless mode`);
        }
    }
    //_                                                                                             
    #emit(args) {
        args.path = this.#normalizePath(args.path);
        log.emit(`Emitting  "${args.key}" : ${args.path} : `, args.value);
        // this.emit('*', args);
        return this.emit(args.path, args) || this.emit('', args);
    }
    #normalizePath(path) {
        // log.norm(`\nbefore : ${path}`)
        if (Array.isArray(path)) {
            log.norm(`path is array, joining at delimiter: ${this.DELIMITER}`);
            path = path.join(this.DELIMITER);
        }
        if (path.trim() === '' || path.trim() === '/') {
            return '/';
        }
        let split = this.#splitPath(path);
        let _path = split.join(this.DELIMITER);
        log.norm(`Normalized path: ${path} => ${_path}`);
        return _path;
    }
    //_                                                                                             
    #handleEmitAll() {
        log.emitAll('Parsing store to emit events for every key...');
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
        visitNodes(this.INTERNAL_STORE, (_path, value) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPath(_path)
                .filter(x => x.trim() !== '');
            let key = split[split.length - 1] ?? '/';
            let path = split.length ? split.join(this.DELIMITER) : '/';
            if (!emitted.includes(path)) {
                emitted.push(path);
                // log.emitAll(`EMITTING: "${path}" => "${value}"`)
                this.#emit({
                    path,
                    key,
                    value,
                });
            }
        });
    }
    //_                                                                                             
    #splitPath(path) {
        return path.split(/\[|\]\[|\]\.|\.|\]|\//g);
    }
    //_                                                                                             
    #splitPathToKey(path) {
        let split = this.#splitPath(path);
        return split[split.length - 1];
    }
    //&                                                                                             
    set = (path, value) => {
        try {
            log.set(`Setting "${path}" : "${value}"`);
            if ((!path && value)
                || (typeof path !== 'object' && !value)) {
                log.set('Incorrect args for "set()". Returning false');
                return false;
            }
            // set the store directly with an object
            // NST.set({ ...newStore })
            if (typeof path === 'object') {
                if (Array.isArray(path)) {
                    lodash.set(this.INTERNAL_STORE, path, value);
                }
                else {
                    this.INTERNAL_STORE = path;
                    this.#emit({
                        path: '/',
                        key: '',
                        value: this.store,
                    });
                }
                return true;
            }
            lodash.set(this.INTERNAL_STORE, path, value);
            this.#emit({
                path,
                key: this.#splitPathToKey(path),
                value,
            });
            return true;
        }
        catch (err) {
            return false;
        }
    };
    //&                                                                                             
    get = (path) => {
        try {
            log.get(`Getting "${path}"`);
            if (!path)
                return this.store;
            if (typeof path === 'function') {
                return path(this.INTERNAL_STORE);
            }
            return lodash.get(this.INTERNAL_STORE, path);
        }
        catch (err) {
            return undefined;
        }
    };
    //&                                                                                             
    reset = () => {
        this.INTERNAL_STORE = this.ORIGINAL_STORE;
        // this.#emit({
        //     path: '/',
        //     key: '/',
        //     value: this.INTERNAL_STORE
        // })
        this.#handleEmitAll();
    };
    //&                                                                                             
    remove = (path) => {
        //! should this delete the key and value from the table or should it set the value to undefined?
        //! this should completely delete the key from the store object
        //! the set() method can set a key to undefined
        this.INTERNAL_STORE = lodash.omit(this.INTERNAL_STORE, [path]);
        this.#emit({
            path,
            key: this.#splitPathToKey(path),
            value: undefined
        });
        this.#handleEmitAll();
    };
    //+ ____________________________________________________________________________________________                                                                                             
    /** @deprecated */
    get paths() {
        let PATH_LIST = [];
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
        visitNodes(this.INTERNAL_STORE, (_path, value) => {
            // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
            let split = this.#splitPath(_path)
                .filter(x => x.trim() !== '');
            // let key = split[split.length - 1] ?? '/'
            let path = split.length ? split.join(this.DELIMITER) : '/';
            if (!PATH_LIST.includes(path)) {
                PATH_LIST.push(path);
                log.set(`keyCount: Counting key at: ${path}`);
            }
        });
        return PATH_LIST;
    }
    //+ ____________________________________________________________________________________________                                                                                             
    get store() {
        return this.ALLOW_DIRECT_MOD
            ? this.INTERNAL_STORE
            : lodash.cloneDeep(this.INTERNAL_STORE);
    }
}
const NST = (store, options) => new nestoreClass(store, options);
export default NST;
