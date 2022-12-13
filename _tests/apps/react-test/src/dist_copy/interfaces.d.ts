export declare type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
};
/** Structure of all values emitted by eventemitter */
export declare type T_NestoreEmit = {
    path: string;
    key: string;
    value?: any;
};
