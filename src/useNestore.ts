import React, { useState, useEffect, useRef } from 'react'
import nestore, { T_Nestore, T_NestoreOptions } from './nestore'
import persistAdapter from './adapters/persistAdapter'

const createStore = <T>(initialStore:Partial<T>, options?: T_NestoreOptions) => {
    
    const NST = nestore(initialStore, options)
    
    const useNestoreHook = (path?:string) => {
        const hasPath = typeof path === 'string' && path.length > 0
        const [value, setValue] = useState(NST.get(path))


        useEffect(()=>{
            // if there is a path - listen on path, else listen for all store changes
            hasPath && NST.on(path, (e) => setValue(e.value))
         

            // if the entire store is updated - update this local state
            NST.onAny((eventName) => {
                // ignore adapter events
                if( Array.isArray(eventName) ? eventName.join('').startsWith('@') : eventName.startsWith('@') ){
                    return;
                }
                // if hook has a path - update that value, else update with entire store
                // hasPath ? setValue(NST.get(path)) : setValue(NST.get())
                // setValue(() => hasPath ? NST.get(path) : NST.get())
                // setValue('what')
                path === '/' || !hasPath ? setValue(NST.store) : hasPath && setValue(NST.get(path))
            })

        }, [])

        const set = (value:any) => path ? NST.set(path, value) : NST.set(value)

        return [value, set]

    }

    return useNestoreHook
}

export default createStore