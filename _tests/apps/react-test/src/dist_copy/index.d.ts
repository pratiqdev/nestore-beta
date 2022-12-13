import EE2 from 'eventemitter2'
import { T_NestoreOptions } from './interfaces'

declare class Nestore<T> extends EE2 {
  #private
  constructor(store?: T | Partial<T>, options?: T_NestoreOptions);
  set: (path: string | Partial<T>, value?: any) => boolean;
  get(path?: string | Function): any;
  reset: () => void
  remove: (path: string) => void
  get store(): Partial<T>;
}
declare function NST<T>(store?: T, options?: T_NestoreOptions): Partial<Nestore<T>>;
export default NST
