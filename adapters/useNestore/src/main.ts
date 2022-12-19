/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { useState, useEffect, useCallback, useMemo } from 'react'
//@ts-ignore
import Nestore, { NSTOptions, NSTEmit } from 'nestore' //~ DEV ONLY
// import Nestore, { NSTEmit, NSTOptions } from 'nestore'

// type Noop = (...args:unknown[]) => {}
// type UseNestoreMutator = (...args:any[]) => any
// type UseNestoreSetter = (value?:any, quiet?: boolean) => boolean;
type UseNestoreHook = (path?:string) => any;
type UseNestoreListener = (event: string | string[], ...values: any[]) => void;




















const createStore = <T>(initialStore?:Partial<T>, options?: NSTOptions): UseNestoreHook => {
  const NST = new Nestore(initialStore, options) as { [key:string]: any }

  const useNestoreHook = (path?:string) => {
    console.log('useNestore | path:', path)

    //$ does this call to useStore() contain a path?
    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path ])

    //$ does this path lead to an in store mutator?
    const isMutator = useMemo(() => typeof path === 'string' && typeof NST[path] === 'function' && path.startsWith('&'), [ path ])

    //$ set the initial state with the value at the given path or the whole store
    const [ value, setValue ] = useState<any>()
    // const [ value, setValue ] = useState(() => hasPath ? NST.get(path) : NST.store)


    //$ The listener is fired every time there is a change to NST
    const listener: UseNestoreListener = useCallback((event:string | string[], ..._values:any[]) =>{
      // ignore adapter events
      if (Array.isArray(event) ? event.join('').startsWith('@') : event.startsWith('@')) {
        console.log('Ignoring adapter event:', event)
        return
      }
      // console.log(_values)
      // if hook has a path - update that value, else update with entire store
      // hasPath ? setValue(NST.get(path)) : setValue(NST.get())
      // setValue(() => hasPath ? NST.get(path) : NST.get())
      // setValue('what')
      if (path === '/' || !hasPath) {
        console.log('useNestore | path = "/" or no path | setValue(store)')
        //! any event was fired - if the whole store was updated with set({})
        //! then "/" will be emitted.
        setValue(NST.store)
      } else if (hasPath) {
        console.log(`useNestore | path = "${path}" | setValue(get(path))`)
        setValue(NST.get(path))
      } else {
        console.log('what???????')
      }
    }, [ path ])

    const set = (_value:any, quiet?:boolean) => (
      hasPath ? NST.set(path, _value, quiet) : NST.set(_value, null, quiet)
    )



    useEffect(() => {
      // return early if this is an internal mutator function - ref to the mutator func never changes
      if(isMutator) return

      // if there is a path - listen on path, else listen for all store changes
      hasPath ? NST.on(path!, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

      //$ Listen to any changes to the store at path: "/"
      //$ if the entire store is updated - update this local state
      NST.onAny(listener)
    }, [ path ])





    if(hasPath && isMutator){
      return NST[path as string]
    }
  

    console.log('>> STORE:', path)
    return [ value, set ]
  }

  return useNestoreHook
}

export default createStore
