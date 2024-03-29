/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable import/no-unresolved */
import { useState, useEffect, useCallback, useMemo } from 'react'
import Nestore from './nestore'
import type { NSTEmit, NestoreOptions } from './nestore'

// type Noop = (...args:unknown[]) => {}
// type UseNestoreMutator = (...args:any[]) => any
// type UseNestoreSetter = (value?:any, quiet?: boolean) => boolean;
type UseNestoreHook = (path?:string) => any;
type UseNestoreListener = (event: string | string[], ...values: any[]) => void;




















const createStore = <T>(initialStore:Partial<T>, options?: NestoreOptions): UseNestoreHook => {
  const NST = new Nestore(initialStore, options) as { [key:string]: any }

  const useNestoreHook = (path?:string) => {
    console.log('useNestore | path:', path)

    const hasPath = useMemo(() => typeof path === 'string' && path.length > 0, [ path ])
    const isMutator = useMemo(() => typeof path === 'string' && typeof NST[path] === 'function', [ path ])
    const [ value, setValue ] = useState(hasPath ? NST.get(path) : NST.store)

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
      hasPath ? NST.on(path!, (e:NSTEmit) => setValue(e.value as Partial<T>)) : NST.on('/', (e:NSTEmit) => setValue(e.value))

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

  return useNestoreHook
}

export default createStore
