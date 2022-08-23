import assert from 'assert'
import nestore from './dist/nestore.js'
import debug from 'debug'

const log = debug('nestore')


const NST = nestore({
    A:'a',
    B:'b',
    C:'c',
    D:'d',
    E:'e',
})

let recievedEvents = []

//$ Register events
NST.on('A', (data) => recievedEvents.push(`A = ${data}`))
NST.on('B', (data) => recievedEvents.push(`B = ${data}`))
NST.on('C', (data) => recievedEvents.push(`C = ${data}`))
NST.on('D', (data) => recievedEvents.push(`D = ${data}`))
NST.on('E', (data) => recievedEvents.push(`E = ${data}`))
NST.on('nestore-reset', (data) => recievedEvents.push(`reset = store`))


//$ set and emit events
NST.set('A', 'apple')
NST.set('B', 'banana')
NST.set('C', 'cherry')
NST.set('D', 'donut')
NST.set('E', 'eclair')

NST.reset()

//$ events should include A B C D E from setters
assert( recievedEvents.includes( `A = apple` ) )
assert( recievedEvents.includes( `B = banana` ) )
assert( recievedEvents.includes( `C = cherry` ) )
assert( recievedEvents.includes( `D = donut` ) )
assert( recievedEvents.includes( `E = eclair` ) )


// //$ events should include A B C D E with original store values
// assert( recievedEvents.includes( `A = a` ) )
// assert( recievedEvents.includes( `B = b` ) )
// assert( recievedEvents.includes( `C = c` ) )
// assert( recievedEvents.includes( `D = d` ) )
// assert( recievedEvents.includes( `E = e` ) )
console.log('events:', recievedEvents)