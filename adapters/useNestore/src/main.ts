/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { useState, useEffect, useCallback, useMemo } from 'react'
//@ts-ignore
import nestore, { NSTOptions, NSTEmit, NSTInstance } from 'nestore'
import debug from 'debug'

// type Noop = (...args:unknown[]) => {}
// type UseNestoreMutator = (...args:any[]) => any
// type UseNestoreSetter = (value?:any, quiet?: boolean) => boolean;
type UseNestoreHook = (path?:string) => any;
type UseNestoreListener = (event: string | string[], ...values: any[]) => void;



const log = debug('nestore:use-nestore')
















const createStore = <T>(initialStore?:Partial<T>, options?: NSTOptions): UseNestoreHook => {

  //@ts-ignore
  const NST = nestore(initialStore, options, true) as NSTInstance

  console.log('||> >> got store:', NST)
  

  const useNestoreHook1 = (path?:string) => {
    // log('path:', path)
    console.log('||> USE NESTORE HOOK')
    
    console.log('||> checking for path:', path)
    //$ does this call to useStore() contain a path?
    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path, NST ])
    
    console.log('||> checking for mutator and root types')
    //$ does this path lead to an in store mutator?
    const isMutator = useMemo(() => typeof NST.get === 'function' ? typeof path === 'string' && typeof NST[path] === 'function' : null, [ path, NST ])
    const isRoot = useMemo(() => !path || path === '/', [ path, NST ])
    
    console.log('||> getting previous value')
    const prevVal = useMemo(() => typeof NST.get === 'function' ? hasPath ? NST.get(path) : NST.store : null, [ path, NST ])

    //$ set the initial state with the value at the given path or the whole store
    // const [ value, setValue ] = useState<any>()
    const [ value, setValue ] = useState(prevVal)
    const [ trig, setTrig ] = useState(false)


    //$ The listener is fired every time there is a change to NST
    const listener: UseNestoreListener = useCallback((event:string | string[], ..._values:any[]) =>{
      if (!NST || typeof NST.get !== 'function') return
      
      // const _log = log.extend('listener')
      console.log('Listener any event:', {
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
        console.log(`path = "/" or no path | Setting value to entire store with force update trigger (${trig}):`, store)
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
        console.log(`path = "${path}" | Setting value to NST.get(path):`, val)
        setValue(val)
      } else {
        console.log('what???????')
      }
    }, [ path, NST ])

    const set = (_value:any, quiet?:boolean) => {
      console.log('||> setting value:', _value, quiet)
      
      //~ devext flag is required for updates with no "path" - invokes emitAll()
      return hasPath ? NST.set(path, _value) : NST.set(_value, null, 'all')
    }
    

    useEffect(() => {
      if(!NST) return
      // if(!NST){
      //   (async ()=>{
      //     console.log('||> No NST - creating nestore...')

      //     const N = await nestore(initialStore, options)
      //     if(!NST) NST = N
      //   })()
      //   return
      // }
      // const _log = log.extend('useEffect')
      // return early if this is an internal mutator function - ref to the mutator func never changes
      if(isMutator) return

      // if there is a path - listen on path, else listen for all store changes
      hasPath ? NST.on(path!, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

      if(hasPath){
        console.log('||> registering listener on path...')
        
        NST.on(path!, (e:NSTEmit) => {
          console.log(`Path emitted:`, {path, value: e.value})
          setValue(e.value as Partial<T>)
        })

      }
      else{
          console.log('||> no path - listening for all changes')
        NST.onAny(listener)
        NST.on('/', (e:NSTEmit) => {
          console.log(`Path emitted:`, {path: '/', value: e.value})
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
    }, [ path, NST ])
    
    
 



    if(hasPath && isMutator){
      console.log('||> path to mutator - returning NST[pathToMutator]')
      return NST[path as string]
    }
    return [ value, set ]
  }

  const useNestoreHook2 = (path?:string) => {
    // log('path:', path)
    console.log('||> USE NESTORE HOOK')
    
    console.log('||> checking for path:', path)
    //$ does this call to useStore() contain a path?
    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path, NST ])
    
    console.log('||> checking for mutator and root types')
    //$ does this path lead to an in store mutator?
    const isMutator = useMemo(() => typeof NST.get === 'function' ? typeof path === 'string' && typeof NST[path] === 'function' : null, [ path, NST ])
    const isRoot = useMemo(() => !path || path === '/', [ path, NST ])
    
    console.log('||> getting previous value')
    const prevVal = useMemo(() => typeof NST.get === 'function' ? hasPath ? NST.get(path) : NST.store : null, [ path, NST ])

    //$ set the initial state with the value at the given path or the whole store
    // const [ value, setValue ] = useState<any>()
    const [ value, setValue ] = useState(prevVal)
    const [ trig, setTrig ] = useState(false)


    //$ The listener is fired every time there is a change to NST
    const listener: UseNestoreListener = useCallback((event:string | string[], ..._values:any[]) =>{
      if (!NST || typeof NST.get !== 'function') return
      
      // const _log = log.extend('listener')
      console.log('Listener any event:', {
        event,
        path,
        hasPath,
        isMutator,
      })


      // ignore adapter events
      if (Array.isArray(event) ? event.join('').startsWith('@') : event.startsWith('@')) {
        return
      }

      if (isRoot) {
        let store = NST.get()
        console.log(`path = "/" or no path | Setting value to entire store with force update trigger (${trig}):`, store)
        setValue({ ...store })
  
      } else if (hasPath) {
        let val = NST.get(path)
        console.log(`path = "${path}" | Setting value to NST.get(path):`, val)
        setValue(val)
      } else {
        console.log('what???????')
      }
    }, [ path, NST ])

    const set = (_value:any, quiet?:boolean) => {
      console.log('||> setting value:', _value, quiet)
      
      //~ devext flag is required for updates with no "path" - invokes emitAll()
      return hasPath ? NST.set(path, _value) : NST.set(_value, null, 'all')
    }
    

    useEffect(() => {
      if(isMutator || typeof NST.get !== 'function') return

      // if there is a path - listen on path, else listen for all store changes
      hasPath ? NST.on(path!, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

      if(hasPath){
        console.log('||> registering listener on path...')
        
        NST.on(path!, (e:NSTEmit) => {
          console.log(`Path emitted:`, {path, value: e.value})
          setValue(e.value as Partial<T>)
        })
      }
      else{
          console.log('||> no path - listening for all changes')
        NST.onAny(listener)
        NST.on('/', (e:NSTEmit) => {
          console.log(`Path emitted:`, {path: '/', value: e.value})
          setValue(e.value as Partial<T>)
        })
      }

    }, [ path, NST ])
    
    
 



    if(hasPath && isMutator){
      console.log('||> path to mutator - returning NST[pathToMutator]')
      return NST[path as string]
    }
    return [ value, set ]
  }

  const useNestoreHook3 = (path?:string) => {
    
    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path ])
    const isMutator = useMemo(() => typeof path === 'string' && typeof NST[path] === 'function', [ path ])
    const [ value, setValue ] = useState(hasPath ? NST.get(path) : NST.store)

    console.log('useNestore:', {
      path,
      pathType: typeof path,
      hasPath,
      isMutator,
      value,
      store: NST.store
    })
    
    const listener: UseNestoreListener = useCallback((event:string | string[], ..._values:any[]) =>{
      // ignore adapter events
      if (Array.isArray(event) ? event.join('').startsWith('@') : event.startsWith('@')) {
        console.log('Ignoring adapter event:', event)
        return
      }
      console.log(_values)
      // if hook has a path - update that value, else update with entire store
      // hasPath ? setValue(NST.get(path)) : setValue(NST.get())
      // setValue(() => hasPath ? NST.get(path) : NST.get())
      // setValue('what')
      if (path === '/' || !hasPath) {
        console.log('useNestore | path = "/" or no path | setValue(store)')
        setValue(NST.store)
      } else if (hasPath) {
        console.log(`useNestore | path = "${path}" | setValue(get(path))`)
        setValue(NST.get(path))
      } else {
        console.log('what???????')
      }
    }, [ path ])

    useEffect(() => {
      // return early if this is an internal mutator function
      if (isMutator) return
      // if there is a path - listen on path, else listen for all store changes
      hasPath ? NST.on(path as string, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

      // if the entire store is updated - update this local state
      NST.onAny(listener)
    }, [ path ])

    const set = (_value:any, quiet?:boolean) => (
      path ? NST.set(path, _value, quiet) : NST.set(_value, null, quiet)
    )

    if (isMutator && hasPath) {
      return NST[path as string]
    }
    return [ value, set ]
  }

  return useNestoreHook3
}

export default createStore
