import React, { useState, useEffect, useRef } from 'react'
import nestore, { T_Nestore, T_NestoreOptions } from './nestore'
import persistAdapter from './adapters/persistAdapter'

const createStore = <T>(initialStore:Partial<T>, options?: T_NestoreOptions) => {
    
    const NST = nestore(initialStore, options)
    
    const useNestoreHook = (path?:string) => {
        console.log('useNestore | path:', path)
        const hasPath = typeof path === 'string' && path.length > 0
        const [value, setValue] = useState(hasPath ? NST.get(path) : NST.store)


        useEffect(()=>{
            // if there is a path - listen on path, else listen for all store changes
            hasPath ? NST.on(path, (e) => setValue(e.value)) : NST.on('/', (e) => setValue(e.value))
         

            // if the entire store is updated - update this local state
            NST.onAny((eventName) => {
                // ignore adapter events
                if( Array.isArray(eventName) ? eventName.join('').startsWith('@') : eventName.startsWith('@') ){
                    console.log(`Ignoring adapter event:`, eventName)
                    return;
                }
                // if hook has a path - update that value, else update with entire store
                // hasPath ? setValue(NST.get(path)) : setValue(NST.get())
                // setValue(() => hasPath ? NST.get(path) : NST.get())
                // setValue('what')
                if(path === '/' || !hasPath){
                    console.log(`useNestore | path = "/" or no path | setValue(store)`)
                    setValue(NST.store)
                } else if(hasPath){
                    console.log(`useNestore | path = "${path}" | setValue(get(path))`)
                    setValue(NST.get(path))
                }else{
                    console.log('what???????')
                }
            })

        }, [])

        const set = (value:any) => path ? NST.set(path, value) : NST.set(value)

        return [value, set]

    }

    return useNestoreHook
}

export default createStore