// /* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-underscore-dangle */
import EE2 from 'eventemitter2'
import {
  omit, set, get, isEqual
} from 'lodash-es'
import debug from 'debug'
import type {
  NestoreOptions,
  DevExtension,
  DevExtensionMessageObject,
  ExtensionConnector,
  NestoreEmit,
  NestoreGetterFunction,
  NodeVisitor
} from './types'
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const createLog = (namespace:string) => debug(`nestore:${namespace}`)

const COMMON = {
  NESTORE_ROOT_KEY: 'NESTORE_STORE_ROOT_KEY',
  DEFAULT_DELIMITER_CHAR: '.'
}

// type NodeVisitor = (path:string, value:unknown) => unknown;

const splitPath = (path:string) => path.split(/\[|\]\[|\]\.|\.|\]|\//g)
//                                 path.split(/\[|\]\[|\]\.|\.|\]|\//g)

const getLastKeyFromPathString = (path:string) => {
  const split = splitPath(path)
  return split[split.length - 1]
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
/** Nestore? */
class Nestore<T> extends EE2 {
  #INTERNAL_STORE: Partial<T>

  #ORIGINAL_STORE: Partial<T>

  #NESTORE_OPTIONS: NestoreOptions

  #DELIMITER_CHAR: string

  #CUSTOM_MUTATORS: string[]

  #LISTENER_MUTATORS: string[]

  #PREVENT_REPEAT_UPDATE: boolean

  #DEV_EXTENSION: null | DevExtension

  constructor (store: Partial<T> = {}, options: NestoreOptions = {}) {
    super({
      wildcard: options.wildcard !== false,
      delimiter: typeof options.delimiter === 'string' ? options.delimiter : '.',
      verboseMemoryLeak: options.verbose === true,
      maxListeners: typeof options.maxListeners === 'number' &&
                options.maxListeners <= Number.MAX_SAFE_INTEGER &&
                options.maxListeners >= Number.MIN_SAFE_INTEGER
        ? options.maxListeners
        : 10
    })
    const log = createLog('constr')
    // console.log('>> NESTORE V4 (2e893d0)')
    log('Creating store...')

    this.#INTERNAL_STORE = {}
    this.#ORIGINAL_STORE = {}
    this.#NESTORE_OPTIONS = options
    this.#DELIMITER_CHAR = ''
    this.#CUSTOM_MUTATORS = []
    this.#LISTENER_MUTATORS = []
    this.#PREVENT_REPEAT_UPDATE = true
    this.#DEV_EXTENSION = null

    // if (store instanceof Nestore) { store }

    if (typeof store !== 'object' || Array.isArray(store)) {
      throw new Error("nestore | Initial store must be of type: object  eg: { myKey: 'myValue' }")
    }

    // type CustomMutator = (instance: Nestore<T>, args?: unknown[]) => unknown;
    // type ListenerMutator = (instance: Nestore<T>, event: NestoreEmit) => unknown;

    // store && Object.entries(store).forEach(([ key, val ]) => {
    //   if (typeof val === 'function') {
    //     if (key.startsWith('$')) {
    //       this.#LISTENER_MUTATORS.push(key)
    //       const SETTER: ListenerMutator = val
    //       const path = key.substring(1, key.length)
    //       this.on(path, (event) => SETTER(this, event))
    //     } else {
    //       this.#CUSTOM_MUTATORS.push(key)
    //       const SETTER: CustomMutator = val
    //       // // this[key] = (...args:any) => SETTER(this, args)
    //       // let newStruct = {
    //       //     loading: this.#adapter_loadingData,
    //       //     loaded: this.#adapter_loadedData,
    //       //     saving: this.#adapter_savingData,
    //       //     saved: this.#adapter_savedData,
    //       //     registered: this.#adapter_registered,
    //       //     error: this.#adapter_error,
    //       //     store: this.store,
    //       //     onUpdate: this.onAny
    //       // }
    //       // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //       // @ts-ignore
    //       this[key] = (...args:unknown) => SETTER(this, args)
    //     }
    //   }
    // })
    this.#registerMutators()

    const storeOmitted:Partial<T> = Object.fromEntries(Object.entries(store)
      .filter(([ KEY ]:[string, unknown]) => !this.#CUSTOM_MUTATORS
        .includes(KEY))) as Partial<T>

    this.#PREVENT_REPEAT_UPDATE = options.preventRepeatUpdates !== false
    this.#INTERNAL_STORE = storeOmitted
    this.#ORIGINAL_STORE = JSON.parse(JSON.stringify(storeOmitted))
    this.#DELIMITER_CHAR = typeof options.delimiter === 'string'
      ? options.delimiter
      : COMMON.DEFAULT_DELIMITER_CHAR

    // handle connecting to the redux-devtools browser extension
    // if (typeof window === 'object' && '__REDUX_DEVTOOLS_EXTENSION__' in window) {
    //   const devlog = createLog('devtool')

    //   // log(`Found window and devTools`)
    //   try {
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore
    //     const extensionConnector: ExtensionConnector = window.__REDUX_DEVTOOLS_EXTENSION__
    //     let devext:DevExtension

    //     if (!extensionConnector) {
    //       log('Nestore - No devtools found. Please install/enable Redux devtools extension')
    //     } else {
    //       devext = extensionConnector.connect()
    //       // log(`Connected to devtools`)

    //       devext.init(this.#INTERNAL_STORE)
    //       // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
    //       // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
    //       devext.subscribe((message: any) => {
    //         log('devext message:', message)
    //         if (message.state) {
    //           // pass a flag about the expected behaviour for set
    //           this.set(JSON.parse(message.state), null, 'devext')
    //         }
    //       })
    //       this.#DEV_EXTENSION = devext
    //       devlog('Devtools registered')
    //     }
    //   } catch (err) {
    //     devlog('Devtools error:', err)
    //   }
    // }
    this.#registerDevtools()

    // log('='.repeat(80))
    log('Store created:', store)

    // if (typeof options.adapter === 'function') {
    //   try {
    //     options.adapter(this)
    //     log('Adapter registered')
    //   } catch (err) {
    //     console.log('Error registering adapter:', err)
    //   }
    // }
    this.#registerAdapter()

    // log('='.repeat(80))
  }

  #registerMutators () {
    type CustomMutator = (instance: Nestore<T>, args?: unknown[]) => unknown;
    type ListenerMutator = (instance: Nestore<T>, event: NestoreEmit) => unknown;

    this.#INTERNAL_STORE && Object.entries(this.#INTERNAL_STORE).forEach(([ key, val ]) => {
      if (typeof val === 'function') {
        if (key.startsWith('$')) {
          this.#LISTENER_MUTATORS.push(key)
          const SETTER: ListenerMutator = val as ListenerMutator
          const path = key.substring(1, key.length)
          this.on(path, (event) => SETTER(this, event))
        } else {
          this.#CUSTOM_MUTATORS.push(key)
          const SETTER: CustomMutator = val as CustomMutator
          // let newStruct = {
          //     loading: this.#adapter_loadingData,
          //     loaded: this.#adapter_loadedData,
          //     saving: this.#adapter_savingData,
          //     saved: this.#adapter_savedData,
          //     registered: this.#adapter_registered,
          //     error: this.#adapter_error,
          //     store: this.store,
          //     onUpdate: this.onAny
          // }
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this[key] = (...args:unknown) => SETTER(this, args)
        }
      }
    })
  }

  #registerDevtools () {
    const log = createLog('devtools')
    if (typeof window === 'object' && '__REDUX_DEVTOOLS_EXTENSION__' in window) {
      const devlog = createLog('devtool')

      // log(`Found window and devTools`)
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const extensionConnector: ExtensionConnector = window.__REDUX_DEVTOOLS_EXTENSION__
        let devext:DevExtension

        if (!extensionConnector) {
          log('Nestore - No devtools found. Please install/enable Redux devtools extension')
        } else {
          devext = extensionConnector.connect()
          // log(`Connected to devtools`)

          devext.init(this.#INTERNAL_STORE)
          // devext.send('@@NESTORE_CONNECT', this.#INTERNAL_STORE )
          // devTools.send('@@NESTORE_CONNECT', { value: 'state changed' })
          devext.subscribe((message:DevExtensionMessageObject) => {
            log('devext message:', message)
            if (message.state) {
              // pass a flag about the expected behaviour for set
              this.set(JSON.parse(message.state), null, 'devext')
            }
          })
          this.#DEV_EXTENSION = devext
          devlog('Devtools registered')
        }
      } catch (err) {
        devlog('Devtools error:', err)
      }
    }
  }

  #registerAdapter () {
    const log = createLog('adapter')
    if (typeof this.#NESTORE_OPTIONS.adapter === 'function') {
      try {
        this.#NESTORE_OPTIONS.adapter(this)
        log('Adapter registered')
      } catch (err) {
        console.log('Error registering adapter:', err)
      }
    }
  }

  // _
  #emit (args:NestoreEmit) {
    // const log = console.log
    const emitObj = {
      ...args
    }
    const log = createLog('emit')
    emitObj.path = this.#convertStringOrArrayToNormalizedPathString(args.path)
    log(`>> Emitting  "${emitObj.path}" =>`, emitObj.value)
    // if(this.#DEV_EXTENSION){
    //     log('sending state to devtools:', args)
    //     this.#DEV_EXTENSION.send(args.path, this.#INTERNAL_STORE)
    // }else{
    //     log(`no dev ext`)
    // }
    return this.emit(emitObj.path, emitObj) || this.emit('', emitObj)
  }

  // _
  #handleEmitAll (ignoreRoot?:boolean) {
    const log = createLog('emit-all')
    log('Parsing store to emit events for every key...')
    log(this.store)

    const emitted:string[] = []

    const visitNodes = (
      obj:Record<string, unknown>,
      visitor:NodeVisitor,
      stack:unknown[] = []
    ) => {
      if (typeof obj === 'object') {
        Object.keys(obj).forEach((key:string) => {
          visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj)
          const thisNode: Record<string, unknown> = obj[key] as Record<string, unknown>
          visitNodes(thisNode, visitor, [ ...stack, key ])
        })
      } else {
        visitor(stack.join('.').replace(/(?:\.)(\d+)(?![a-z_])/ig, '[$1]'), obj)
      }
    }

    const visitor: NodeVisitor = (_path:string, value:unknown) => {
      // let split = _path.split(/\[|\]\[|\]\.|\.|\]/g)
      const split = splitPath(_path)
        .filter((x) => x.trim() !== '')

      const key = split[split.length - 1] ?? '/'
      const path = split.length ? split.join(this.#DELIMITER_CHAR) : '/'

      if (!emitted.includes(path)) {
        if (ignoreRoot && path === '/') return
        emitted.push(path)

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
          value
        })
      }
    }

    visitNodes(this.store, visitor)
  }

  // _
  #convertStringOrArrayToNormalizedPathString (path:string | string[]) {
    const log = createLog('normPath')
    let p:typeof path = path

    // log.norm(`\nbefore : ${path}`)
    if (Array.isArray(p)) {
      log(`path is array, joining at delimiter: ${this.#DELIMITER_CHAR}`)
      p = p.join(this.#DELIMITER_CHAR)
    }

    if (p.trim() === '' || p.trim() === '/') {
      return '/'
    }

    const split = splitPath(p)
    const pathResult:string = split.join(this.#DELIMITER_CHAR)
    // log.norm(`Normalized path: ${path} => ${_path}`)

    return pathResult
  }

  // &
  // TODO: find a better solution for update types than flag string
  set = (path:string | Partial<T>, value?:unknown, flag?: string) => {
    try {
      const log = createLog('set')

      if (this.#PREVENT_REPEAT_UPDATE) {
        if (typeof path === 'string' && isEqual(get(this.#INTERNAL_STORE, path), value)) {
          log('Provided value already matches stored value, skipping...')
          log({
            new: value,
            old: get(this.#INTERNAL_STORE, path)
          })
          return false
        } if (typeof path === 'object' && isEqual(this.store, path)) {
          log('Provided newStore already matches store, skipping...')
          return false
        }
      } else {
        log('"preventRepeatUpdate" disabled')
      }

      if (
        (typeof path === 'undefined' && typeof value === 'undefined') ||
        (typeof path === 'undefined' && typeof value !== 'undefined') ||
        (typeof path !== 'object' && typeof value === 'undefined')
      ) {
        log('Incorrect args for "set()" :', { path, value })
        return false
      }

      // set the store directly with an object
      // NST.set({ ...newStore })
      if (typeof path === 'object') {
        const originalValue = this.#INTERNAL_STORE

        if (!Array.isArray(path)) {
          this.#INTERNAL_STORE = { ...path }
        }

        if (flag === 'devext') {
          log('devext | Set - set new store - handle emit all')
          this.#handleEmitAll(true)
        } else if (flag !== 'quiet') {
          log(`Setting normally "/" : "${value}"`)
          this.#emit({
            path: '/',
            key: '',
            value: this.store
          })
        } else {
          log(`Setting quietly "/" : "${value}"`)
        }

        if (flag !== 'devext') {
          this.#DEV_EXTENSION &&
            this.#DEV_EXTENSION.send({
              type: '/: store => newStore',
              path: '/',
              previousValue: originalValue,
              value: this.store
            }, this.store)
        }

        return true
      }

      // log(`Setting "${path}" : "${value}"`)
      const originalValue = this.#DEV_EXTENSION ? this.get(path) : null

      set(this.#INTERNAL_STORE, path, value)

      if (this.#DEV_EXTENSION) {
        this.#DEV_EXTENSION.send({
          type: `${path}: "${originalValue}" => "${value}"`,
          previousValue: originalValue,
          path,
          value
        }, this.store)
      }

      if (flag !== 'quiet') {
        log(`Setting normally "${path}" : "${value}"`)

        this.#emit({
          path,
          key: getLastKeyFromPathString(path),
          value
        })
      } else {
        log(`Setting quietly "/" : "${value}"`)
      }

      return true
    } catch (err) {
      return false
    }
  }

  // &
  get (path?: string | NestoreGetterFunction): Partial<T> | undefined {
    try {
      const log = createLog('get')
      if (!path || path === '') {
        log('Nullish "path" argument: returning entire store.')
        return this.store
      }
      log(`Getting "${path}"`)

      if (typeof path === 'function') {
        return path(this.store)
      }

      return get(this.#INTERNAL_STORE, path)
    } catch (err) {
      return undefined
    }
  }

  // &
  reset = () => {
    const log = createLog('reset')

    log('-'.repeat(60))
    log('current store:')
    log(this.#INTERNAL_STORE)
    log('-'.repeat(60))

    if (this.#DEV_EXTENSION) {
      this.#DEV_EXTENSION.send({
        type: '/: store => originalStore',
        path: '/',
        previousValue: this.#INTERNAL_STORE,
        value: this.#ORIGINAL_STORE
      }, this.#ORIGINAL_STORE)
    }

    this.#INTERNAL_STORE = this.#ORIGINAL_STORE

    log('reset store:')
    log(this.#INTERNAL_STORE)
    log('-'.repeat(60))
    // this.#emit({
    //     path: '/',
    //     key: '/',
    //     value: this.#INTERNAL_STORE
    // })
    this.#handleEmitAll()
  }

  // &
  remove = (path: string) => {
    const log = createLog('remove')
    log(`Deleting value at path: ${path}`)

    //! should this delete the key and value from the table or should it set the value to undefined?
    //! this should completely delete the key from the store object
    //! the set() method can set a key to undefined

    let og

    if (this.#DEV_EXTENSION) {
      og = this.get(path)
    }

    this.#INTERNAL_STORE = omit(this.#INTERNAL_STORE, [ path ])

    if (this.#DEV_EXTENSION) {
      this.#DEV_EXTENSION.send({
        type: `REMOVE: ${path}`,
        previousValue: og,
        path,
        value: undefined
      }, this.#INTERNAL_STORE)
    }

    this.#emit({
      path,
      key: getLastKeyFromPathString(path),
      value: undefined

    })
    //! Why is this being called here!?
    //! Remove events should ONLY fire an event for the namespace of the key that was removed
    this.#handleEmitAll()
  }

  get store () {
    // ~
    // return cloneDeep(this.#INTERNAL_STORE)
    return { ...this.#INTERNAL_STORE }
  }
}

// ~ Dont do this...
// ~ Just export the class and let the user instantiate a new nestore
function NST<T> (store?: T, options?: NestoreOptions): Nestore<Partial<T>> {
  return new Nestore<Partial<T>>(store, options)
  // let nst = new Nestore<Partial<T>>(store, options)
  // return omit(nst, nst.#CUSTOM_MUTATORS)
}

export default NST
