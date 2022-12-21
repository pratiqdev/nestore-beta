/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { useState, useEffect, useCallback, useMemo } from 'react'
//@ts-ignore
import Nestore, { NSTOptions, NSTEmit } from '../../nestore/index.js' //~ DEV ONLY
// import Nestore, { NSTEmit, NSTOptions } from 'nestore'
import debug from 'debug'

// type Noop = (...args:unknown[]) => {}
// type UseNestoreMutator = (...args:any[]) => any
// type UseNestoreSetter = (value?:any, quiet?: boolean) => boolean;
type UseNestoreHook = (path?:string) => any;
type UseNestoreListener = (event: string | string[], ...values: any[]) => void;



const log = debug('nestore').extend('use-nestore')
















const createStore = <T>(initialStore?:Partial<T>, options?: NSTOptions): UseNestoreHook => {
  const NST = new Nestore(initialStore, options) as { [key:string]: any }

  const useNestoreHook = (path?:string) => {
    // log('path:', path)

    //$ does this call to useStore() contain a path?
    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path ])

    //$ does this path lead to an in store mutator?
    const isMutator = useMemo(() => typeof path === 'string' && typeof NST[path] === 'function', [ path ])
    const isRoot = useMemo(() => !path || path === '/', [ path ])

    const prevVal = useMemo(() => hasPath ? NST.get(path) : NST.store, [ path ])

    //$ set the initial state with the value at the given path or the whole store
    // const [ value, setValue ] = useState<any>()
    const [ value, setValue ] = useState(prevVal)
    const [ trig, setTrig ] = useState(false)


    //$ The listener is fired every time there is a change to NST
    const listener: UseNestoreListener = useCallback((event:string | string[], ..._values:any[]) =>{
      const _log = log.extend('listener')
      _log('Listener any event:', {
        event,
        path,
        hasPath,
        isMutator,
      })


      // ignore adapter events
      if (Array.isArray(event) ? event.join('').startsWith('@') : event.startsWith('@')) {
        // console.log('Ignoring adapter event:', event)
        return
      }
      // console.log(_values)
      // if hook has a path - update that value, else update with entire store
      // hasPath ? setValue(NST.get(path)) : setValue(NST.get())
      // setValue(() => hasPath ? NST.get(path) : NST.get())
      // setValue('what')


      if (isRoot) {
        //! any event was fired - if the whole store was updated with set({})
        //! then "/" will be emitted.
        let store = NST.get()
        _log(`path = "/" or no path | Setting value to entire store with force update trigger (${trig}):`, store)
        //~ REACT COMPARES OBJECTS BY REFERENCE - USING Object.is()
        //!
        //! [object Object]<Ref*1> === [object Object]<Ref*1>
        //! [object Object]<Ref*3> !== [object Object]<Ref*1>
        //!
        //! Object.is() considers the following values as the "same"
        //! undefined === null
        //! true === true
        //! 'exact-string' === 'exact-string'
        //! 1234.00 === 1234.00
        //~ THE STORE CAN NOT BE DEREFFED BY CLONING, SPREADING, ETC.
        //~ IT MUST MAINTAIN THE ORIGINAL REFERENCE TO THE STORE
        //~ ACCORDING TO THE CURRENT SETUP OF MUTABILITTY IN NESTORE
        //~
        //~ USING AN EMPTY TRIGGER WONT WORK UNLESS IT IS RETURNED  FROM THE HOOK
        //~ MAYBE A WHOLE OBJECT COULD BE RETURNED: [value, setValue, { updated: Date, updates: 7, path, key }]
        setValue({ ...store })
        // setTrig((b) => {
        //   if(b === true) {
        //     _log('Settting trigger to false')
        //     return false
        //   }
        //   _log('Settting trigger to true')
        //   return true
        // })
      } else if (hasPath) {
        let val = NST.get(path)
        _log(`path = "${path}" | Setting value to NST.get(path):`, val)
        setValue(val)
      } else {
        console.log('what???????')
      }
    }, [ path ])

    const set = (_value:any, quiet?:boolean) => (
      //~ devext flag is required for updates with no "path" - invokes emitAll()
      hasPath ? NST.set(path, _value) : NST.set(_value, null, 'devext')
    )
    

    useEffect(() => {
      const _log = log.extend('useEffect')
      // return early if this is an internal mutator function - ref to the mutator func never changes
      if(isMutator) return

      // if there is a path - listen on path, else listen for all store changes
      hasPath ? NST.on(path!, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

      if(hasPath){
        NST.on(path!, (e:NSTEmit) => {
          _log(`Path emitted:`, {path, value: e.value})
          setValue(e.value as Partial<T>)
        })
      }
      else{
        NST.onAny(listener)
        NST.on('/', (e:NSTEmit) => {
          _log(`Path emitted:`, {path: '/', value: e.value})
          setValue(e.value as Partial<T>)
        })
      }
      //$ Listen to any changes to the store at path: "/"
      //$ if the entire store is updated - update this local state

      // return () => {
      //   NST.off(path, (e:NSTEmit) => {
      //     _log(`Path emitted:`, {path, value: e.value})
      //     setValue(e.value as Partial<T>)
      //   })
      // }
    }, [ path ])
    
    
 



    if(hasPath && isMutator){
      return NST[path as string]
    }
    return [ value, set ]
  }

  return useNestoreHook
}

export default createStore
