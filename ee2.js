/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
/* eslint-disable */

!(function (undefined) {
  const { hasOwnProperty } = Object
  const isArray = Array.isArray
    ? Array.isArray
    : function _isArray (obj) {
      return Object.prototype.toString.call(obj) === '[object Array]'
    }
  const defaultMaxListeners = 10
  const nextTickSupported = typeof process === 'object' && typeof process.nextTick === 'function'
  const symbolsSupported = typeof Symbol === 'function'
  const reflectSupported = typeof Reflect === 'object'
  const setImmediateSupported = typeof setImmediate === 'function'
  const _setImmediate = setImmediateSupported ? setImmediate : setTimeout
  const ownKeys = symbolsSupported
    ? (reflectSupported && typeof Reflect.ownKeys === 'function'
        ? Reflect.ownKeys
        : function (obj) {
          const arr = Object.getOwnPropertyNames(obj)
          arr.push.apply(arr, Object.getOwnPropertySymbols(obj))
          return arr
        })
    : Object.keys

  function init () {
    this._events = {}
    if (this._conf) {
      configure.call(this, this._conf)
    }
  }

  function configure (conf) {
    if (conf) {
      this._conf = conf

      conf.delimiter && (this.delimiter = conf.delimiter)

      if (conf.maxListeners !== undefined) {
        this._maxListeners = conf.maxListeners
      }

      conf.wildcard && (this.wildcard = conf.wildcard)
      conf.newListener && (this._newListener = conf.newListener)
      conf.removeListener && (this._removeListener = conf.removeListener)
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak)
      conf.ignoreErrors && (this.ignoreErrors = conf.ignoreErrors)

      if (this.wildcard) {
        this.listenerTree = {}
      }
    }
  }

  function logPossibleMemoryLeak (count, eventName) {
    let errorMsg = '(node) warning: possible EventEmitter memory ' +
          `leak detected. ${count} listeners added. ` +
          'Use emitter.setMaxListeners() to increase limit.'

    if (this.verboseMemoryLeak) {
      errorMsg += ` Event name: ${eventName}.`
    }

    if (typeof process !== 'undefined' && process.emitWarning) {
      const e = new Error(errorMsg)
      e.name = 'MaxListenersExceededWarning'
      e.emitter = this
      e.count = count
      process.emitWarning(e)
    } else {
      console.error(errorMsg)

      if (console.trace) {
        console.trace()
      }
    }
  }

  const toArray = function (a, b, c) {
    let n = arguments.length
    switch (n) {
      case 0:
        return []
      case 1:
        return [ a ]
      case 2:
        return [ a, b ]
      case 3:
        return [ a, b, c ]
      default:
        var arr = new Array(n)
        while (n--) {
          arr[n] = arguments[n]
        }
        return arr
    }
  }

  function toObject (keys, values) {
    const obj = {}
    let key
    const len = keys.length
    const valuesCount = values ? values.length : 0
    for (let i = 0; i < len; i++) {
      key = keys[i]
      obj[key] = i < valuesCount ? values[i] : undefined
    }
    return obj
  }

  function TargetObserver (emitter, target, options) {
    this._emitter = emitter
    this._target = target
    this._listeners = {}
    this._listenersCount = 0

    let on,
      off

    if (options.on || options.off) {
      on = options.on
      off = options.off
    }

    if (target.addEventListener) {
      on = target.addEventListener
      off = target.removeEventListener
    } else if (target.addListener) {
      on = target.addListener
      off = target.removeListener
    } else if (target.on) {
      on = target.on
      off = target.off
    }

    if (!on && !off) {
      throw Error('target does not implement any known event API')
    }

    if (typeof on !== 'function') {
      throw TypeError('on method must be a function')
    }

    if (typeof off !== 'function') {
      throw TypeError('off method must be a function')
    }

    this._on = on
    this._off = off

    const { _observers } = emitter
    if (_observers) {
      _observers.push(this)
    } else {
      emitter._observers = [ this ]
    }
  }

  Object.assign(TargetObserver.prototype, {
    subscribe: function (event, localEvent, reducer) {
      const observer = this
      const target = this._target
      const emitter = this._emitter
      const listeners = this._listeners
      const handler = function () {
        const args = toArray.apply(null, arguments)
        const eventObj = {
          data: args,
          name: localEvent,
          original: event
        }
        if (reducer) {
          const result = reducer.call(target, eventObj)
          if (result !== false) {
            emitter.emit.apply(emitter, [ eventObj.name ].concat(args))
          }
          return
        }
        emitter.emit.apply(emitter, [ localEvent ].concat(args))
      }

      if (listeners[event]) {
        throw Error(`Event '${event}' is already listening`)
      }

      this._listenersCount++

      if (emitter._newListener && emitter._removeListener && !observer._onNewListener) {
        this._onNewListener = function (_event) {
          if (_event === localEvent && listeners[event] === null) {
            listeners[event] = handler
            observer._on.call(target, event, handler)
          }
        }

        emitter.on('newListener', this._onNewListener)

        this._onRemoveListener = function (_event) {
          if (_event === localEvent && !emitter.hasListeners(_event) && listeners[event]) {
            listeners[event] = null
            observer._off.call(target, event, handler)
          }
        }

        listeners[event] = null

        emitter.on('removeListener', this._onRemoveListener)
      } else {
        listeners[event] = handler
        observer._on.call(target, event, handler)
      }
    },

    unsubscribe: function (event) {
      const observer = this
      const listeners = this._listeners
      const emitter = this._emitter
      let handler
      let events
      const off = this._off
      const target = this._target
      let i

      if (event && typeof event !== 'string') {
        throw TypeError('event must be a string')
      }

      function clearRefs () {
        if (observer._onNewListener) {
          emitter.off('newListener', observer._onNewListener)
          emitter.off('removeListener', observer._onRemoveListener)
          observer._onNewListener = null
          observer._onRemoveListener = null
        }
        const index = findTargetIndex.call(emitter, observer)
        emitter._observers.splice(index, 1)
      }

      if (event) {
        handler = listeners[event]
        if (!handler) return
        off.call(target, event, handler)
        delete listeners[event]
        if (!--this._listenersCount) {
          clearRefs()
        }
      } else {
        events = ownKeys(listeners)
        i = events.length
        while (i-- > 0) {
          event = events[i]
          off.call(target, event, listeners[event])
        }
        this._listeners = {}
        this._listenersCount = 0
        clearRefs()
      }
    }
  })

  function resolveOptions (options, schema, reducers, allowUnknown) {
    const computedOptions = { ...schema }

    if (!options) return computedOptions

    if (typeof options !== 'object') {
      throw TypeError('options must be an object')
    }

    const keys = Object.keys(options)
    const { length } = keys
    let option,
      value
    let reducer

    function reject (reason) {
      throw Error(`Invalid "${option}" option value${reason ? `. Reason: ${reason}` : ''}`)
    }

    for (let i = 0; i < length; i++) {
      option = keys[i]
      if (!allowUnknown && !hasOwnProperty.call(schema, option)) {
        throw Error(`Unknown "${option}" option`)
      }
      value = options[option]
      if (value !== undefined) {
        reducer = reducers[option]
        computedOptions[option] = reducer ? reducer(value, reject) : value
      }
    }
    return computedOptions
  }

  function constructorReducer (value, reject) {
    if (typeof value !== 'function' || !value.hasOwnProperty('prototype')) {
      reject('value must be a constructor')
    }
    return value
  }

  function makeTypeReducer (types) {
    const message = `value must be type of ${types.join('|')}`
    const len = types.length
    const firstType = types[0]
    const secondType = types[1]

    if (len === 1) {
      return function (v, reject) {
        if (typeof v === firstType) {
          return v
        }
        reject(message)
      }
    }

    if (len === 2) {
      return function (v, reject) {
        const kind = typeof v
        if (kind === firstType || kind === secondType) return v
        reject(message)
      }
    }

    return function (v, reject) {
      const kind = typeof v
      let i = len
      while (i-- > 0) {
        if (kind === types[i]) return v
      }
      reject(message)
    }
  }

  const functionReducer = makeTypeReducer([ 'function' ])

  const objectFunctionReducer = makeTypeReducer([ 'object', 'function' ])

  function makeCancelablePromise (Promise, executor, options) {
    let isCancelable
    let callbacks
    let timer = 0
    let subscriptionClosed

    var promise = new Promise((resolve, reject, onCancel) => {
      options = resolveOptions(options, {
        timeout: 0,
        overload: false
      }, {
        timeout: function (value, reject) {
          value *= 1
          if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
            reject('timeout must be a positive number')
          }
          return value
        }
      })

      isCancelable = !options.overload && typeof Promise.prototype.cancel === 'function' && typeof onCancel === 'function'

      function cleanup () {
        if (callbacks) {
          callbacks = null
        }
        if (timer) {
          clearTimeout(timer)
          timer = 0
        }
      }

      const _resolve = function (value) {
        cleanup()
        resolve(value)
      }

      const _reject = function (err) {
        cleanup()
        reject(err)
      }

      if (isCancelable) {
        executor(_resolve, _reject, onCancel)
      } else {
        callbacks = [ function (reason) {
          _reject(reason || Error('canceled'))
        } ]
        executor(_resolve, _reject, (cb) => {
          if (subscriptionClosed) {
            throw Error('Unable to subscribe on cancel event asynchronously')
          }
          if (typeof cb !== 'function') {
            throw TypeError('onCancel callback must be a function')
          }
          callbacks.push(cb)
        })
        subscriptionClosed = true
      }

      if (options.timeout > 0) {
        timer = setTimeout(() => {
          const reason = Error('timeout')
          reason.code = 'ETIMEDOUT'
          timer = 0
          promise.cancel(reason)
          reject(reason)
        }, options.timeout)
      }
    })

    if (!isCancelable) {
      promise.cancel = function (reason) {
        if (!callbacks) {
          return
        }
        const { length } = callbacks
        for (let i = 1; i < length; i++) {
          callbacks[i](reason)
        }
        // internal callback to reject the promise
        callbacks[0](reason)
        callbacks = null
      }
    }

    return promise
  }

  function findTargetIndex (observer) {
    const observers = this._observers
    if (!observers) {
      return -1
    }
    const len = observers.length
    for (let i = 0; i < len; i++) {
      if (observers[i]._target === observer) return i
    }
    return -1
  }

  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree (handlers, type, tree, i, typeLength) {
    if (!tree) {
      return null
    }

    if (i === 0) {
      const kind = typeof type
      if (kind === 'string') {
        let ns; var n; let l = 0; let j = 0; const { delimiter } = this; const
          dl = delimiter.length
        if ((n = type.indexOf(delimiter)) !== -1) {
          ns = new Array(5)
          do {
            ns[l++] = type.slice(j, n)
            j = n + dl
          } while ((n = type.indexOf(delimiter, j)) !== -1)

          ns[l++] = type.slice(j)
          type = ns
          typeLength = l
        } else {
          type = [ type ]
          typeLength = 1
        }
      } else if (kind === 'object') {
        typeLength = type.length
      } else {
        type = [ type ]
        typeLength = 1
      }
    }

    let listeners = null; let branch; let xTree; let xxTree; let isolatedBranch; let endReached; const currentType = type[i]
    const nextType = type[i + 1]; let branches; let
      _listeners

    if (i === typeLength) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //

      if (tree._listeners) {
        if (typeof tree._listeners === 'function') {
          handlers && handlers.push(tree._listeners)
          listeners = [ tree ]
        } else {
          handlers && handlers.push.apply(handlers, tree._listeners)
          listeners = [ tree ]
        }
      }
    } else if (currentType === '*') {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      branches = ownKeys(tree)
      n = branches.length
      while (n-- > 0) {
        branch = branches[n]
        if (branch !== '_listeners') {
          _listeners = searchListenerTree(handlers, type, tree[branch], i + 1, typeLength)
          if (_listeners) {
            if (listeners) {
              listeners.push.apply(listeners, _listeners)
            } else {
              listeners = _listeners
            }
          }
        }
      }
      return listeners
    } else if (currentType === '**') {
      endReached = (i + 1 === typeLength || (i + 2 === typeLength && nextType === '*'))
      if (endReached && tree._listeners) {
        // The next element has a _listeners, add it to the handlers.
        listeners = searchListenerTree(handlers, type, tree, typeLength, typeLength)
      }

      branches = ownKeys(tree)
      n = branches.length
      while (n-- > 0) {
        branch = branches[n]
        if (branch !== '_listeners') {
          if (branch === '*' || branch === '**') {
            if (tree[branch]._listeners && !endReached) {
              _listeners = searchListenerTree(handlers, type, tree[branch], typeLength, typeLength)
              if (_listeners) {
                if (listeners) {
                  listeners.push.apply(listeners, _listeners)
                } else {
                  listeners = _listeners
                }
              }
            }
            _listeners = searchListenerTree(handlers, type, tree[branch], i, typeLength)
          } else if (branch === nextType) {
            _listeners = searchListenerTree(handlers, type, tree[branch], i + 2, typeLength)
          } else {
            // No match on this one, shift into the tree but not in the type array.
            _listeners = searchListenerTree(handlers, type, tree[branch], i, typeLength)
          }
          if (_listeners) {
            if (listeners) {
              listeners.push.apply(listeners, _listeners)
            } else {
              listeners = _listeners
            }
          }
        }
      }
      return listeners
    } else if (tree[currentType]) {
      listeners = searchListenerTree(handlers, type, tree[currentType], i + 1, typeLength)
    }

    xTree = tree['*']
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i + 1, typeLength)
    }

    xxTree = tree['**']
    if (xxTree) {
      if (i < typeLength) {
        if (xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength, typeLength)
        }

        // Build arrays of matching next branches and others.
        branches = ownKeys(xxTree)
        n = branches.length
        while (n-- > 0) {
          branch = branches[n]
          if (branch !== '_listeners') {
            if (branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i + 2, typeLength)
            } else if (branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i + 1, typeLength)
            } else {
              isolatedBranch = {}
              isolatedBranch[branch] = xxTree[branch]
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i + 1, typeLength)
            }
          }
        }
      } else if (xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength, typeLength)
      } else if (xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength, typeLength)
      }
    }

    return listeners
  }

  function growListenerTree (type, listener, prepend) {
    let len = 0; let j = 0; let i; const { delimiter } = this; const dl = delimiter.length; let
      ns

    if (typeof type === 'string') {
      if ((i = type.indexOf(delimiter)) !== -1) {
        ns = new Array(5)
        do {
          ns[len++] = type.slice(j, i)
          j = i + dl
        } while ((i = type.indexOf(delimiter, j)) !== -1)

        ns[len++] = type.slice(j)
      } else {
        ns = [ type ]
        len = 1
      }
    } else {
      ns = type
      len = type.length
    }

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    if (len > 1) {
      for (i = 0; i + 1 < len; i++) {
        if (ns[i] === '**' && ns[i + 1] === '**') {
          return
        }
      }
    }

    let tree = this.listenerTree; let
      name

    for (i = 0; i < len; i++) {
      name = ns[i]

      tree = tree[name] || (tree[name] = {})

      if (i === len - 1) {
        if (!tree._listeners) {
          tree._listeners = listener
        } else {
          if (typeof tree._listeners === 'function') {
            tree._listeners = [ tree._listeners ]
          }

          if (prepend) {
            tree._listeners.unshift(listener)
          } else {
            tree._listeners.push(listener)
          }

          if (
            !tree._listeners.warned &&
                this._maxListeners > 0 &&
                tree._listeners.length > this._maxListeners
          ) {
            tree._listeners.warned = true
            logPossibleMemoryLeak.call(this, tree._listeners.length, name)
          }
        }
        return true
      }
    }

    return true
  }

  function collectTreeEvents (tree, events, root, asArray) {
    const branches = ownKeys(tree)
    let i = branches.length
    let branch,
      branchName,
      path
    const hasListeners = tree._listeners
    let isArrayPath

    while (i-- > 0) {
      branchName = branches[i]

      branch = tree[branchName]

      if (branchName === '_listeners') {
        path = root
      } else {
        path = root ? root.concat(branchName) : [ branchName ]
      }

      isArrayPath = asArray || typeof branchName === 'symbol'

      hasListeners && events.push(isArrayPath ? path : path.join(this.delimiter))

      if (typeof branch === 'object') {
        collectTreeEvents.call(this, branch, events, path, isArrayPath)
      }
    }

    return events
  }

  function recursivelyGarbageCollect (root) {
    const keys = ownKeys(root)
    let i = keys.length
    let obj,
      key,
      flag
    while (i-- > 0) {
      key = keys[i]
      obj = root[key]

      if (obj) {
        flag = true
        if (key !== '_listeners' && !recursivelyGarbageCollect(obj)) {
          delete root[key]
        }
      }
    }

    return flag
  }

  function Listener (emitter, event, listener) {
    this.emitter = emitter
    this.event = event
    this.listener = listener
  }

  Listener.prototype.off = function () {
    this.emitter.off(this.event, this.listener)
    return this
  }

  function setupListener (event, listener, options) {
    if (options === true) {
      promisify = true
    } else if (options === false) {
      async = true
    } else {
      if (!options || typeof options !== 'object') {
        throw TypeError('options should be an object or true')
      }
      var { async } = options
      var { promisify } = options
      var { nextTick } = options
      var { objectify } = options
    }

    if (async || nextTick || promisify) {
      const _listener = listener
      const _origin = listener._origin || listener

      if (nextTick && !nextTickSupported) {
        throw Error('process.nextTick is not supported')
      }

      if (promisify === undefined) {
        promisify = listener.constructor.name === 'AsyncFunction'
      }

      listener = function () {
        const args = arguments
        const context = this
        const { event } = this

        return promisify
          ? (nextTick
              ? Promise.resolve()
              : new Promise((resolve) => {
                _setImmediate(resolve)
              }).then(() => {
                context.event = event
                return _listener.apply(context, args)
              }))
          : (nextTick ? process.nextTick : _setImmediate)(() => {
              context.event = event
              _listener.apply(context, args)
            })
      }

      listener._async = true
      listener._origin = _origin
    }

    return [ listener, objectify ? new Listener(this, event, listener) : this ]
  }

  function EventEmitter (conf) {
    this._events = {}
    this._newListener = false
    this._removeListener = false
    this.verboseMemoryLeak = false
    configure.call(this, conf)
  }

  EventEmitter.EventEmitter2 = EventEmitter // backwards compatibility for exporting EventEmitter property

  EventEmitter.prototype.listenTo = function (target, events, options) {
    if (typeof target !== 'object') {
      throw TypeError('target musts be an object')
    }

    const emitter = this

    options = resolveOptions(options, {
      on: undefined,
      off: undefined,
      reducers: undefined
    }, {
      on: functionReducer,
      off: functionReducer,
      reducers: objectFunctionReducer
    })

    function listen (events) {
      if (typeof events !== 'object') {
        throw TypeError('events must be an object')
      }

      const { reducers } = options
      const index = findTargetIndex.call(emitter, target)
      let observer

      if (index === -1) {
        observer = new TargetObserver(emitter, target, options)
      } else {
        observer = emitter._observers[index]
      }

      const keys = ownKeys(events)
      const len = keys.length
      let event
      const isSingleReducer = typeof reducers === 'function'

      for (let i = 0; i < len; i++) {
        event = keys[i]
        observer.subscribe(
          event,
          events[event] || event,
          isSingleReducer ? reducers : reducers && reducers[event]
        )
      }
    }

    isArray(events)
      ? listen(toObject(events))
      : (typeof events === 'string' ? listen(toObject(events.split(/\s+/))) : listen(events))

    return this
  }

  EventEmitter.prototype.stopListeningTo = function (target, event) {
    const observers = this._observers

    if (!observers) {
      return false
    }

    let i = observers.length
    let observer
    let matched = false

    if (target && typeof target !== 'object') {
      throw TypeError('target should be an object')
    }

    while (i-- > 0) {
      observer = observers[i]
      if (!target || observer._target === target) {
        observer.unsubscribe(event)
        matched = true
      }
    }

    return matched
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.'

  EventEmitter.prototype.setMaxListeners = function (n) {
    if (n !== undefined) {
      this._maxListeners = n
      if (!this._conf) this._conf = {}
      this._conf.maxListeners = n
    }
  }

  EventEmitter.prototype.getMaxListeners = function () {
    return this._maxListeners
  }

  EventEmitter.prototype.event = ''

  EventEmitter.prototype.once = function (event, fn, options) {
    return this._once(event, fn, false, options)
  }

  EventEmitter.prototype.prependOnceListener = function (event, fn, options) {
    return this._once(event, fn, true, options)
  }

  EventEmitter.prototype._once = function (event, fn, prepend, options) {
    return this._many(event, 1, fn, prepend, options)
  }

  EventEmitter.prototype.many = function (event, ttl, fn, options) {
    return this._many(event, ttl, fn, false, options)
  }

  EventEmitter.prototype.prependMany = function (event, ttl, fn, options) {
    return this._many(event, ttl, fn, true, options)
  }

  EventEmitter.prototype._many = function (event, ttl, fn, prepend, options) {
    const self = this

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function')
    }

    function listener () {
      if (--ttl === 0) {
        self.off(event, listener)
      }
      return fn.apply(this, arguments)
    }

    listener._origin = fn

    return this._on(event, listener, prepend, options)
  }

  EventEmitter.prototype.emit = function () {
    if (!this._events && !this._all) {
      return false
    }

    this._events || init.call(this)

    let type = arguments[0]; let ns; const
      { wildcard } = this
    let args,
      l,
      i,
      j,
      containsSymbol

    if (type === 'newListener' && !this._newListener) {
      if (!this._events.newListener) {
        return false
      }
    }

    if (wildcard) {
      ns = type
      if (type !== 'newListener' && type !== 'removeListener') {
        if (typeof type === 'object') {
          l = type.length
          if (symbolsSupported) {
            for (i = 0; i < l; i++) {
              if (typeof type[i] === 'symbol') {
                containsSymbol = true
                break
              }
            }
          }
          if (!containsSymbol) {
            type = type.join(this.delimiter)
          }
        }
      }
    }

    const al = arguments.length
    let handler

    if (this._all && this._all.length) {
      handler = this._all.slice()

      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type
        switch (al) {
          case 1:
            handler[i].call(this, type)
            break
          case 2:
            handler[i].call(this, type, arguments[1])
            break
          case 3:
            handler[i].call(this, type, arguments[1], arguments[2])
            break
          default:
            handler[i].apply(this, arguments)
        }
      }
    }

    if (wildcard) {
      handler = []
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0, l)
    } else {
      handler = this._events[type]
      if (typeof handler === 'function') {
        this.event = type
        switch (al) {
          case 1:
            handler.call(this)
            break
          case 2:
            handler.call(this, arguments[1])
            break
          case 3:
            handler.call(this, arguments[1], arguments[2])
            break
          default:
            args = new Array(al - 1)
            for (j = 1; j < al; j++) args[j - 1] = arguments[j]
            handler.apply(this, args)
        }
        return true
      } if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice()
      }
    }

    if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1)
        for (j = 1; j < al; j++) args[j - 1] = arguments[j]
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type
        switch (al) {
          case 1:
            handler[i].call(this)
            break
          case 2:
            handler[i].call(this, arguments[1])
            break
          case 3:
            handler[i].call(this, arguments[1], arguments[2])
            break
          default:
            handler[i].apply(this, args)
        }
      }
      return true
    } if (!this.ignoreErrors && !this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        throw arguments[1] // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.")
      }
    }

    return !!this._all
  }

  EventEmitter.prototype.emitAsync = function () {
    if (!this._events && !this._all) {
      return false
    }

    this._events || init.call(this)

    let type = arguments[0]; const { wildcard } = this; let ns; let
      containsSymbol
    let args,
      l,
      i,
      j

    if (type === 'newListener' && !this._newListener) {
      if (!this._events.newListener) { return Promise.resolve([ false ]) }
    }

    if (wildcard) {
      ns = type
      if (type !== 'newListener' && type !== 'removeListener') {
        if (typeof type === 'object') {
          l = type.length
          if (symbolsSupported) {
            for (i = 0; i < l; i++) {
              if (typeof type[i] === 'symbol') {
                containsSymbol = true
                break
              }
            }
          }
          if (!containsSymbol) {
            type = type.join(this.delimiter)
          }
        }
      }
    }

    const promises = []

    const al = arguments.length
    let handler

    if (this._all) {
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type
        switch (al) {
          case 1:
            promises.push(this._all[i].call(this, type))
            break
          case 2:
            promises.push(this._all[i].call(this, type, arguments[1]))
            break
          case 3:
            promises.push(this._all[i].call(this, type, arguments[1], arguments[2]))
            break
          default:
            promises.push(this._all[i].apply(this, arguments))
        }
      }
    }

    if (wildcard) {
      handler = []
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0)
    } else {
      handler = this._events[type]
    }

    if (typeof handler === 'function') {
      this.event = type
      switch (al) {
        case 1:
          promises.push(handler.call(this))
          break
        case 2:
          promises.push(handler.call(this, arguments[1]))
          break
        case 3:
          promises.push(handler.call(this, arguments[1], arguments[2]))
          break
        default:
          args = new Array(al - 1)
          for (j = 1; j < al; j++) args[j - 1] = arguments[j]
          promises.push(handler.apply(this, args))
      }
    } else if (handler && handler.length) {
      handler = handler.slice()
      if (al > 3) {
        args = new Array(al - 1)
        for (j = 1; j < al; j++) args[j - 1] = arguments[j]
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type
        switch (al) {
          case 1:
            promises.push(handler[i].call(this))
            break
          case 2:
            promises.push(handler[i].call(this, arguments[1]))
            break
          case 3:
            promises.push(handler[i].call(this, arguments[1], arguments[2]))
            break
          default:
            promises.push(handler[i].apply(this, args))
        }
      }
    } else if (!this.ignoreErrors && !this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]) // Unhandled 'error' event
      }
      return Promise.reject("Uncaught, unspecified 'error' event.")
    }

    return Promise.all(promises)
  }

  EventEmitter.prototype.on = function (type, listener, options) {
    return this._on(type, listener, false, options)
  }

  EventEmitter.prototype.prependListener = function (type, listener, options) {
    return this._on(type, listener, true, options)
  }

  EventEmitter.prototype.onAny = function (fn) {
    return this._onAny(fn, false)
  }

  EventEmitter.prototype.prependAny = function (fn) {
    return this._onAny(fn, true)
  }

  EventEmitter.prototype.addListener = EventEmitter.prototype.on

  EventEmitter.prototype._onAny = function (fn, prepend) {
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function')
    }

    if (!this._all) {
      this._all = []
    }

    // Add the function to the event listener collection.
    if (prepend) {
      this._all.unshift(fn)
    } else {
      this._all.push(fn)
    }

    return this
  }

  EventEmitter.prototype._on = function (type, listener, prepend, options) {
    if (typeof type === 'function') {
      this._onAny(type, listener)
      return this
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function')
    }
    this._events || init.call(this)

    let returnValue = this; let
      temp

    if (options !== undefined) {
      temp = setupListener.call(this, type, listener, options)
      listener = temp[0]
      returnValue = temp[1]
    }

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    if (this._newListener) {
      this.emit('newListener', type, listener)
    }

    if (this.wildcard) {
      growListenerTree.call(this, type, listener, prepend)
      return returnValue
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener
    } else {
      if (typeof this._events[type] === 'function') {
        // Change to array.
        this._events[type] = [ this._events[type] ]
      }

      // If we've already got an array, just add
      if (prepend) {
        this._events[type].unshift(listener)
      } else {
        this._events[type].push(listener)
      }

      // Check for listener leak
      if (
        !this._events[type].warned &&
          this._maxListeners > 0 &&
          this._events[type].length > this._maxListeners
      ) {
        this._events[type].warned = true
        logPossibleMemoryLeak.call(this, this._events[type].length, type)
      }
    }

    return returnValue
  }

  EventEmitter.prototype.off = function (type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function')
    }

    let handlers; let leafs = []

    if (this.wildcard) {
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice()
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0)
      if (!leafs) return this
    } else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this
      handlers = this._events[type]
      leafs.push({ _listeners: handlers })
    }

    for (let iLeaf = 0; iLeaf < leafs.length; iLeaf++) {
      const leaf = leafs[iLeaf]
      handlers = leaf._listeners
      if (isArray(handlers)) {
        let position = -1

        for (let i = 0, { length } = handlers; i < length; i++) {
          if (handlers[i] === listener ||
              (handlers[i].listener && handlers[i].listener === listener) ||
              (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i
            break
          }
        }

        if (position < 0) {
          continue
        }

        if (this.wildcard) {
          leaf._listeners.splice(position, 1)
        } else {
          this._events[type].splice(position, 1)
        }

        if (handlers.length === 0) {
          if (this.wildcard) {
            delete leaf._listeners
          } else {
            delete this._events[type]
          }
        }
        if (this._removeListener) this.emit('removeListener', type, listener)

        return this
      }
      if (handlers === listener ||
          (handlers.listener && handlers.listener === listener) ||
          (handlers._origin && handlers._origin === listener)) {
        if (this.wildcard) {
          delete leaf._listeners
        } else {
          delete this._events[type]
        }
        if (this._removeListener) this.emit('removeListener', type, listener)
      }
    }

    this.listenerTree && recursivelyGarbageCollect(this.listenerTree)

    return this
  }

  EventEmitter.prototype.offAny = function (fn) {
    let i = 0; let l = 0; let
      fns
    if (fn && this._all && this._all.length > 0) {
      fns = this._all
      for (i = 0, l = fns.length; i < l; i++) {
        if (fn === fns[i]) {
          fns.splice(i, 1)
          if (this._removeListener) this.emit('removeListenerAny', fn)
          return this
        }
      }
    } else {
      fns = this._all
      if (this._removeListener) {
        for (i = 0, l = fns.length; i < l; i++) this.emit('removeListenerAny', fns[i])
      }
      this._all = []
    }
    return this
  }

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off

  EventEmitter.prototype.removeAllListeners = function (type) {
    if (type === undefined) {
      !this._events || init.call(this)
      return this
    }

    if (this.wildcard) {
      const leafs = searchListenerTree.call(this, null, type, this.listenerTree, 0); let leaf; let
        i
      if (!leafs) return this
      for (i = 0; i < leafs.length; i++) {
        leaf = leafs[i]
        leaf._listeners = null
      }
      this.listenerTree && recursivelyGarbageCollect(this.listenerTree)
    } else if (this._events) {
      this._events[type] = null
    }
    return this
  }

  EventEmitter.prototype.listeners = function (type) {
    const { _events } = this
    let keys,
      listeners,
      allListeners
    let i
    let listenerTree

    if (type === undefined) {
      if (this.wildcard) {
        throw Error('event name required for wildcard emitter')
      }

      if (!_events) {
        return []
      }

      keys = ownKeys(_events)
      i = keys.length
      allListeners = []
      while (i-- > 0) {
        listeners = _events[keys[i]]
        if (typeof listeners === 'function') {
          allListeners.push(listeners)
        } else {
          allListeners.push.apply(allListeners, listeners)
        }
      }
      return allListeners
    }
    if (this.wildcard) {
      listenerTree = this.listenerTree
      if (!listenerTree) return []
      const handlers = []
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice()
      searchListenerTree.call(this, handlers, ns, listenerTree, 0)
      return handlers
    }

    if (!_events) {
      return []
    }

    listeners = _events[type]

    if (!listeners) {
      return []
    }
    return typeof listeners === 'function' ? [ listeners ] : listeners
  }

  EventEmitter.prototype.eventNames = function (nsAsArray) {
    const { _events } = this
    return this.wildcard ? collectTreeEvents.call(this, this.listenerTree, [], null, nsAsArray) : (_events ? ownKeys(_events) : [])
  }

  EventEmitter.prototype.listenerCount = function (type) {
    return this.listeners(type).length
  }

  EventEmitter.prototype.hasListeners = function (type) {
    if (this.wildcard) {
      const handlers = []
      const ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice()
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0)
      return handlers.length > 0
    }

    const { _events } = this
    const { _all } = this

    return !!(_all && _all.length || _events && (type === undefined ? ownKeys(_events).length : _events[type]))
  }

  EventEmitter.prototype.listenersAny = function () {
    if (this._all) {
      return this._all
    }

    return []
  }

  EventEmitter.prototype.waitFor = function (event, options) {
    const self = this
    const type = typeof options
    if (type === 'number') {
      options = { timeout: options }
    } else if (type === 'function') {
      options = { filter: options }
    }

    options = resolveOptions(options, {
      timeout: 0,
      filter: undefined,
      handleError: false,
      Promise,
      overload: false
    }, {
      filter: functionReducer,
      Promise: constructorReducer
    })

    return makeCancelablePromise(options.Promise, (resolve, reject, onCancel) => {
      function listener () {
        const { filter } = options
        if (filter && !filter.apply(self, arguments)) {
          return
        }
        self.off(event, listener)
        if (options.handleError) {
          const err = arguments[0]
          err ? reject(err) : resolve(toArray.apply(null, arguments).slice(1))
        } else {
          resolve(toArray.apply(null, arguments))
        }
      }

      onCancel(() => {
        self.off(event, listener)
      })

      self._on(event, listener, false)
    }, {
      timeout: options.timeout,
      overload: options.overload
    })
  }

  function once (emitter, name, options) {
    options = resolveOptions(options, {
      Promise,
      timeout: 0,
      overload: false
    }, {
      Promise: constructorReducer
    })

    const _Promise = options.Promise

    return makeCancelablePromise(_Promise, (resolve, reject, onCancel) => {
      let handler
      if (typeof emitter.addEventListener === 'function') {
        handler = function () {
          resolve(toArray.apply(null, arguments))
        }

        onCancel(() => {
          emitter.removeEventListener(name, handler)
        })

        emitter.addEventListener(
          name,
          handler,
          { once: true }
        )
        return
      }

      const eventListener = function () {
        errorListener && emitter.removeListener('error', errorListener)
        resolve(toArray.apply(null, arguments))
      }

      let errorListener

      if (name !== 'error') {
        errorListener = function (err) {
          emitter.removeListener(name, eventListener)
          reject(err)
        }

        emitter.once('error', errorListener)
      }

      onCancel(() => {
        errorListener && emitter.removeListener('error', errorListener)
        emitter.removeListener(name, eventListener)
      })

      emitter.once(name, eventListener)
    }, {
      timeout: options.timeout,
      overload: options.overload
    })
  }

  const { prototype } = EventEmitter

  Object.defineProperties(EventEmitter, {
    defaultMaxListeners: {
      get: function () {
        return prototype._maxListeners
      },
      set: function (n) {
        if (typeof n !== 'number' || n < 0 || Number.isNaN(n)) {
          throw TypeError('n must be a non-negative number')
        }
        prototype._maxListeners = n
      },
      enumerable: true
    },
    once: {
      value: once,
      writable: true,
      configurable: true
    }
  })

  Object.defineProperties(prototype, {
    _maxListeners: {
      value: defaultMaxListeners,
      writable: true,
      configurable: true
    },
    _observers: { value: null, writable: true, configurable: true }
  })

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(() => EventEmitter)
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = EventEmitter
  } else {
    // global for any kind of environment.
    const _global = new Function('', 'return this')()
    _global.EventEmitter2 = EventEmitter
  }
}())
