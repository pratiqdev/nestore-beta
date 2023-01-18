import nestore from '../nestore/index.js'

console.log(nestore)

const initialStore = {
    /** This is the thing */
    someText: 'here',
    someThing: 1234
}

// const NST = nestore<Partial<typeof initialStore>>(initialStore)
const NST = nestore(initialStore)

// console.log('store:')
let val = NST.get('someText')

NST.store.someText
