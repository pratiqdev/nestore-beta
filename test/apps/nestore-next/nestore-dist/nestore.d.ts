import EE2 from 'eventemitter2';
import type { NestoreOptions, NestoreGetterFunction } from './types';
/** Nestore? */
declare class Nestore<T> extends EE2 {
    #private;
    constructor(store?: Partial<T>, options?: NestoreOptions);
    set: (path: string | Partial<T>, value?: unknown, quiet?: boolean) => boolean;
    get(path?: string | NestoreGetterFunction): Partial<T> | undefined;
    reset: (quiet?: boolean) => void;
    remove: (path: string, quiet?: boolean) => void;
    get store(): Partial<T>;
}
declare function NST<T>(store?: T, options?: NestoreOptions): Nestore<Partial<T>>;
export default NST;
