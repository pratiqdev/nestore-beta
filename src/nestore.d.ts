import EE2 from "eventemitter2";
export type NSTOptions = {
    delimiter?: string;
    wildcard?: boolean;
    /**
     *  @deprecated
     *  The store and its values will always be de-reffed from the original
     */
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapters?: NSTAdapter[];
    preventRepeatUpdates?: boolean;
};
export type NSTEmit = {
    path: string;
    key: string;
    value?: any;
};
export type CustomMutator<T> = (this: Nestore<Partial<T>>, args?: any[]) => any;
export type ListenerMutator = any;
export type NSTAnyStore = {
    get: (...args: any[]) => any;
    set: (...args: any[]) => any;
} | {
    getItem: (...args: any[]) => any;
    setItem: (...args: any[]) => any;
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
/** Nestore? */
declare class Nestore<T> extends EE2 {
    #private;
    adapters: {
        [key: string]: NSTAdapterFunctions;
    };
    constructor(initialStore?: T | Partial<T>, options?: NSTOptions);
    set: (path: string | Partial<T>, value?: any, flag?: string) => boolean;
    get(path?: string | Function): any;
    reset: () => void;
    remove: (path: string) => void;
    get store(): Partial<T>;
    get _delimiter(): string;
    get _dev_extension(): any;
    get _internal_store(): Partial<T>;
    get _original_store(): Partial<T>;
    get _setter_functions(): string[];
    get _setter_listeners(): string[];
    get _prevent_repeat_update(): boolean;
    get _emit(): (args: NSTEmit) => boolean;
    get _handleEmitAll(): (ignoreRoot?: boolean | undefined) => void;
    get _get_last_key_from_path_string(): (path: string) => string;
    get _split_path_string_at_known_delimiters(): (path: string) => string[];
    get _convert_string_or_array_to_normalized_path_string(): (path: string | string[]) => string;
}
export type NSTClass<T = void> = Nestore<T>;
declare const nst: Nestore<unknown>;
export type NSTInstance = typeof nst;
export default Nestore;
