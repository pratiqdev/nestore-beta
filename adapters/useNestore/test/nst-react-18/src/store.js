import createStore from 'use-nestore'

const useNestore = createStore({
    greeting: 'Hello, World!'
})

console.log('store and hook created:', useNestore)



export default useNestore