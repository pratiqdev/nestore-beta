/* eslint-disable no-use-before-define */

import EE2 from 'eventemitter2'

declare function NST<T>(store?: T, options?: NestoreOptions): Nestore<Partial<T>>;
export type NestoreObject<T> = Nestore<Partial<T>>;

export declare class Nestore<T> extends EE2 {
  #private?
  constructor(store?: T | Partial<T>, options?: NestoreOptions);
  set: (path: string | Partial<T>, value?: unknown, flag?: string) => boolean;
  get(path?: string | NestoreGetterFunction): Partial<T> | undefined;
  reset: () => void
  remove: (path: string) => void
  get store(): Partial<T>;
}

export type DevExtensionActionObject = {
    /** a string constructed from the path, oldValue and newValue */
    type: string;
    path: string;
    previousValue: unknown;
    value: unknown;
  }

export type DevExtensionMessageObject = {
    state: string;
    [key:string]: unknown;
  }

export type DevExtensionSubscribeCallback = (message:DevExtensionMessageObject) => void

export type DevExtension = {
    send: (actionObject: DevExtensionActionObject, store: unknown) => undefined,
    init: (store: unknown) => undefined;
    subscribe: (callback:DevExtensionSubscribeCallback) => void
};

export type ExtensionConnector = { connect: () => DevExtension };

export type Window = {
    '__REDUX_DEVTOOLS_EXTENSION__': ExtensionConnector;
  }

export type NestoreEmit = {
      path: string;
      key: string;
      value?: unknown;
  }

export type T_AdapterEmit = {
      timestamp: number;
      action: string;
      store: unknown;
  }

export type NestoreOptions = {
    delimiter?: string;
    wildcard?: boolean;
    mutable?: boolean;
    maxListeners?: number;
    verbose?: boolean;
    throwOnRevert?: boolean;
    timeout?: number;
    adapter?: NestoreAdapterReturn;
    preventRepeatUpdates?: boolean;
  }

export type NestoreGetterFunction = <T>(currentStore: Partial<T>) => Partial<T>;
export type NestoreFunction = <T>(initialStore?: T, options?: NestoreOptions) => Nestore<T>
export type NestoreAdapterReturn = <T>(nestore: Nestore<T>) => void;
export type NestoreAdapter = (...args:unknown[]) => <T>(nestore: Nestore<T>) => void;
export type NodeVisitor = (path:string, value:unknown) => unknown;
