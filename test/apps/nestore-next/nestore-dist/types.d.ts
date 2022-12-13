import EE2 from 'eventemitter2';
export declare type NestoreObject<T> = Nestore<Partial<T>>;
export declare class Nestore<T> extends EE2 {
    #private;
    constructor(store?: T | Partial<T>, options?: NestoreOptions);
    set: (path: string | Partial<T>, value?: unknown, quiet?: boolean) => boolean;
    get(path?: string | NestoreGetterFunction): Partial<T> | undefined;
    reset: () => void;
    remove: (path: string) => void;
    get store(): Partial<T>;
}
export declare type DevExtensionActionObject = {
    /** a string constructed from the path, oldValue and newValue */
    type: string;
    path: string;
    previousValue: unknown;
    value: unknown;
};
export declare type DevExtensionMessageObject = {
    state: string;
    [key: string]: unknown;
};
export declare type DevExtensionSubscribeCallback = (message: DevExtensionMessageObject) => void;
export declare type DevExtension = {
    send: (actionObject: DevExtensionActionObject, store: unknown) => undefined;
    init: (store: unknown) => undefined;
    subscribe: (callback: DevExtensionSubscribeCallback) => void;
};
export declare type ExtensionConnector = {
    connect: () => DevExtension;
};
export declare type Window = {
    '__REDUX_DEVTOOLS_EXTENSION__': ExtensionConnector;
};
export declare type NestoreEmit = {
    path: string;
    key: string;
    value?: unknown;
};
export declare type T_AdapterEmit = {
    timestamp: number;
    action: string;
    store: unknown;
};
export declare type NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapter?: NestoreAdapterReturn;
    preventRepeatUpdates?: boolean;
};
export declare type NestoreGetterFunction = <T>(currentStore: Partial<T>) => Partial<T>;
export declare type NestoreFunction = <T>(initialStore?: T, options?: NestoreOptions) => Nestore<T>;
export declare type NestoreAdapterReturn = <T>(nestore: Nestore<T>) => void;
export declare type NestoreAdapter = (...args: unknown[]) => <T>(nestore: Nestore<T>) => void;
export declare type NodeVisitor = (path: string, value: unknown) => unknown;
