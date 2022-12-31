import EE2 from "eventemitter2";
/** Nestore | Dec 19, 2:41 PM */
declare class Nestore<T> extends EE2 {
    #private;
    adapters: {
        [key: string]: NSTAdapterFunctions;
    };
    constructor(initialStore?: T | Partial<T>, options?: NSTOptions);
    /** Should not be provided to user */
    registerStore(): void;
    /** @deprecated - use registerStore */
    registerInStoreListeners(initialStore: Partial<T>): void;
    /** dev tools requires active instance of Nestore to be registered */
    registerDevTools(): void;
    registerAdapter: (adapter: NSTAdapter) => Promise<boolean>;
    /** @deprecated - use public singular method: registerAdapter(singleAdapter) */
    registerAdapters(options: NSTOptions): false | undefined;
    set: (path: string | Partial<T>, value?: any, flag?: NSTEmitFlags) => boolean;
    get(path?: string | Function): any;
    reset: () => void;
    remove: (path: string) => void;
    get store(): Partial<T>;
    get _delimiter(): string;
    get _dev_extension(): any;
    get _internal_store(): Partial<T>;
    get _original_store(): Partial<T>;
    get _STORE_MUTATORS(): string[];
    get _STORE_LISTENERS(): string[];
    get _prevent_repeat_update(): boolean;
    get _emit(): (args: NSTEmit) => boolean;
    get _handleEmitAll(): (ignoreRoot?: boolean | undefined) => void;
    get _get_last_key_from_path_string(): (path: string) => string;
    get _split_path_string_at_known_delimiters(): (path: string) => string[];
    get _convert_string_or_array_to_normalized_path_string(): (path: string | string[]) => string;
}
declare const nestore: NSTFunction;
export type NSTClass<T = void> = Nestore<T>;
declare const nst: Nestore<unknown>;
export type NSTInstance = typeof nst;
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
    adapters?: NSTAdapter[];
    preventRepeatUpdates?: boolean;
    devTools?: boolean;
};
export type NSTEmit = {
    path: string;
    key: string;
    value?: any;
};
export type NSTFunction = <T>(initialStore: T | Partial<T>, options: NSTOptions) => Promise<NSTInstance>;
export type NSTStoreMutator<T> = (this: Nestore<Partial<T>>, args?: any[]) => any;
export type NSTStoreListener = any;
export type NSTAnyStorage = {
    getItem: (...args: unknown[]) => unknown;
    setItem: (...args: unknown[]) => unknown;
};
export type NSTAdapterGenerator = <T>(config: any) => NSTAdapter;
export type NSTAdapterFunctions = {
    namespace: string;
    load: () => Promise<boolean>;
    save: () => Promise<boolean>;
    disconnect?: () => Promise<any>;
};
export type NSTAdapter = <T>(nst: NSTClass<T>) => Promise<NSTAdapterFunctions>;
export type NSTAdapterEmit = {
    timestamp: number;
    action: string;
    store: any;
};
export type NSTEmitFlags = 'none' | 'emit' | 'all';
export default nestore;
