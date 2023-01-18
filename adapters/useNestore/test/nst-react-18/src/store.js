import createStore from 'use-nestore'
import axios from 'axios'


const useNestore = createStore({
    hello: 'World!',
    count: 0,
    time: Date.now(),
    person: {
        name: 'John',
        age: 50,
    },
    setName: (nst, args) => nst && nst.set('person.name', args[0]),
    login: async (nst, args) => {
        const { data } = await axios.get('https://jsonplaceholder.typicode.com/todos')
        data && nst && nst.set('login_data', data)
    }
}, {
    adapters: [
        // createPersistAdapter({
        //     namespace: 'nestore-persist-adapter',
        //     storageKey: 'nst-hook-test-react-persist-key',
        //     batchTime: 4_000,
        // })
    ]
})



export default useNestore