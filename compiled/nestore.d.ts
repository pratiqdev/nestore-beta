import EE2 from "eventemitter2";
/************************************************************************************************ */
export declare type T_NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    allowDirectModification?: boolean;
    maxListeners?: number;
    verboseMemoryLeak?: boolean;
    diffFunction?: (a: any, b: any) => Object;
};
/** Structure of all values emitted by eventemitter */
export declare type T_EmitStruct = {
    path: string;
    key: string;
    value?: any;
};
declare class nestoreClass extends EE2 {
    #private;
    INTERNAL_STORE: Object | Partial<Object>;
    ORIGINAL_STORE: Object | Partial<Object>;
    DELIMITER: string;
    ALLOW_DIRECT_MOD: boolean;
    constructor(store?: Object, options?: T_NestoreOptions);
    set: (path: string | Object, value?: any) => boolean;
    get: (path?: string | Function) => any;
    reset: () => void;
    remove: (path: string) => void;
    /** @deprecated */
    get paths(): string[];
    get store(): Partial<Object>;
}
declare const NST: (store?: Object, options?: T_NestoreOptions) => nestoreClass;
export default NST;
