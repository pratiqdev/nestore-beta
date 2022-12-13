import { useState, useEffect } from 'react'
import NST from './store.js'

const useStore = (key = '/') => {
  const [ state, setState ] = useState()

  useEffect(() => {
    setState(NST.get(key))
    NST.on(key, (data) => setState(data.value))
    return () => NST.remove(key)
  }, [ key ])

  return state
}

export default useStore
