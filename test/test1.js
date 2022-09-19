import assert from 'assert'
import nestore from '../dist/nestore.js'
import { expect } from 'chai';

const heading = (text) => `${text}\n  ${'-'.repeat(text.length)}`

const GLOBAL_NST = nestore({ global: true })

const initialStore = {
    title: 'The Book',
    pages: 817,
    checkedOut: false,
    chapters: ['1-The Start', '2-The Middle', '3-The End'],
    reviews: {
        'someGuy':'This is a book',
        'Some Guy':'This book was... okay.',
        'Big Name':'Best book ever in the world always.',
        'Some Extra':{
            'Stuff Here':{
                find: {
                    'me ?': 'Hello!'
                }
            }
        }
    }

}

const wait = async (time = 250) => {
    setTimeout(()=>{
        return true
    }, time)
}






describe(heading('A | Setup'), () => {

    it('A.1 | Creates a filled store that returns store and methods', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(typeof get === 'function')
        assert(typeof set === 'function')
        assert(typeof reset === 'function')
        assert(typeof store === typeof initialStore)
    });

    it('A.2 | Creates an empty store that returns store and methods', () => {
        const { get, set, reset, store } = nestore()

        assert(typeof get === 'function')
        assert(typeof set === 'function')
        assert(typeof reset === 'function')
        assert(typeof store === typeof initialStore)
    });

    it('A.3 | Store matches initialStore on start', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(store === initialStore)
        assert(typeof store === typeof initialStore)
        assert(JSON.stringify(store) === JSON.stringify(initialStore))
    })

    it('A.4 | Mutliple stores do not modify each other', () => {
        const A = nestore({ name: 'Alice'})
        const B = nestore({ name: 'Bob'})

        assert(A.store.name === 'Alice')
        assert(B.store.name === 'Bob')
        
        A.set('name', 'Andrew')
        assert(A.store.name === 'Andrew')
        assert(B.store.name === 'Bob')

        B.set('name', 'Becky')
        assert(A.store.name === 'Andrew')
        assert(B.store.name === 'Becky')
        
    })

})

describe(heading('B | Get'), () => {

    it('B.1 | Get string method returns correct value', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(get('title') === initialStore.title)
        assert(get('pages') === initialStore.pages)
        assert(get('checkedOut') === initialStore.checkedOut)
        assert(get('chapters[2]') === initialStore.chapters[2])
        assert(get('reviews.someGuy') === initialStore.reviews.someGuy)
        assert(get('reviews["Some Guy"]') === initialStore.reviews['Some Guy'])
        assert(get('reviews["Some Extra"]["Stuff Here"].find["me ?"]') === initialStore.reviews["Some Extra"]["Stuff Here"].find["me ?"])
    })

    it('B.2 | Get string method returns undefined on incorrect path', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(typeof get('frobble') === 'undefined')
        assert(typeof get('pages.frizzle') === 'undefined')
        assert(typeof get('thingy.jimjam') === 'undefined')
    })

    it('B.3 | Get callback method returns correct value', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(get(s => s) === initialStore)
        assert(get(s => s.title) === initialStore.title)

    })

    it('B.4 | Get callback method returns undefined on incorrect path', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(typeof get(s => s.brapple) === 'undefined')
        assert(typeof get(s => s.fimble.famble) === 'undefined')
        assert(typeof get(s => s.fimble.famble['dongle']) === 'undefined')

    })

    it('B.5 | Get method with no args returns entire store', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(get() === initialStore)
        assert(JSON.stringify(get()) === JSON.stringify(initialStore))

    })

})

describe(heading('C | Set'), () => {

    it('C.1 | Set method changes existing values', () => {
        const { get, set, reset, store } = nestore(initialStore)

        set('title', 'The Best Book Ever')
        assert(get('title') === 'The Best Book Ever')
        
    })
    
    it('C.2 | Set method assigns new key-values', () => {
        const { get, set, reset, store } = nestore(initialStore)

        set('brimple', 'boop')
        assert(get('brimple') === 'boop')

        set('dap.bap','tap')
        assert(get('dap.bap') === 'tap')
        
    })

    it('C.3 | Set method should with no args should return false', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert( set() === false )
        assert( set('thing') === false )
        assert( set('thing', 'blap') === true )
    })

    it('C.4 | Set callback method should set correct values', () => {
        const { get, set, reset, store } = nestore(initialStore)

        set(s => s.title = '12345')
        assert( get('title') === '12345' ) 

    })

    it('C.5 | Modify the store without using set method (no events)', () => {
        const NST = nestore(initialStore)

        NST.on('title', ()=> console.log('store was updated...'))

        NST.store.title = '98765'
        NST.store.thangy = 'woop'
        // console.log( get('title') )
        assert( NST.get('title') === '98765')
        assert( NST.get('thangy') === 'woop')




    })

});


describe(heading('D | Events'), () => {

    it('D.1 | Changes to the store made with `set()` emit events', async () => {
        const NST = nestore(initialStore)

        let recievedEvents = []

        //$ A B C D E should be undefined
        assert( typeof NST.get('A') === 'undefined' )
        assert( typeof NST.get('B') === 'undefined' )
        assert( typeof NST.get('C') === 'undefined' )
        assert( typeof NST.get('D') === 'undefined' )
        assert( typeof NST.get('E') === 'undefined' )


        //$ Register events
        NST.on('A', (data) => recievedEvents.push(`A = ${data.value}`))
        NST.on('B', (data) => recievedEvents.push(`B = ${data.value}`))
        NST.on('C', (data) => recievedEvents.push(`C = ${data.value}`))
        NST.on('D', (data) => recievedEvents.push(`D = ${data.value}`))
        NST.on('E', (data) => recievedEvents.push(`E = ${data.value}`))


        //$ set and emit events
        NST.set('A', 'apple')
        NST.set('B', 'banana')
        NST.set('C', 'cherry')
        NST.set('D', 'donut')
        NST.set('E', 'eclair')
        
        //$ store should match setters
        assert( NST.get('A') === 'apple')
        assert( NST.get('B') === 'banana')
        assert( NST.get('C') === 'cherry')
        assert( NST.get('D') === 'donut')
        assert( NST.get('E') === 'eclair')

        //$ events should include A B C D E
        assert( recievedEvents.includes( `A = apple` ) )
        assert( recievedEvents.includes( `B = banana` ) )
        assert( recievedEvents.includes( `C = cherry` ) )
        assert( recievedEvents.includes( `D = donut` ) )
        assert( recievedEvents.includes( `E = eclair` ) )

        
        
        // setTimeout(()=>{
        //     done()
        // }, 1500)
    })

    it('D.2 | Resetting store emits events for every key', () => {
        const NST = nestore({
            A:'a',
            B:'b',
            C:'c',
            D:'d',
            E:'e',
        })

        let recievedEvents = []

        //$ Register events
        NST.on('A', ({value}) => recievedEvents.push(`A = ${value}`))
        NST.on('B', ({value}) => recievedEvents.push(`B = ${value}`))
        NST.on('C', ({value}) => recievedEvents.push(`C = ${value}`))
        NST.on('D', ({value}) => recievedEvents.push(`D = ${value}`))
        NST.on('E', ({value}) => recievedEvents.push(`E = ${value}`))
        NST.on('nestore-reset', (data) => recievedEvents.push(`reset = store`))


        //$ set and emit events
        NST.set('A', 'apple')
        NST.set('B', 'banana')
        NST.set('C', 'cherry')
        NST.set('D', 'donut')
        NST.set('E', 'eclair')


        //$ reset the store to trigger emitAll
        NST.reset()

        
        
        //$ events should include A B C D E from setters
        expect(recievedEvents).to.include('A = apple')        
        expect(recievedEvents).to.include('B = banana')        
        expect(recievedEvents).to.include('C = cherry')        
        expect(recievedEvents).to.include('D = donut')        
        expect(recievedEvents).to.include('E = eclair')        
        
        //$ expect reset event to exist in array
        expect(recievedEvents).to.include('reset = store')        
        
        // //$ events should include A B C D E with original store values
        expect(recievedEvents).to.include('A = a')        
        expect(recievedEvents).to.include('B = b')        
        expect(recievedEvents).to.include('C = c')        
        expect(recievedEvents).to.include('D = d')        
        expect(recievedEvents).to.include('E = e')        

    })

    
    it.only('D.3 | EmitAll emits events with correct paths', () => {

        const sto = {
            title: 'The Book',
            pages: 817,
            checkedOut: false,
            chapters: ['1-The Start', '2-The Middle', '3-The End'],
            flaps: ['AAA', 'BBB', ['xxx', 'yyy', 'zzz']],
            reviews: {
                'someGuy':'This is a book',
                'Some Extra':{
                    'stuff':'here!'
                },
                'Some Guy':'This book was... okay.',
                'more_stuff_here':{
                    find: {
                        'me ?': 'Hello!'
                    }
                },
                'Big Name':'Best book ever in the world always.',
            }

        }

        const NST = nestore(sto)

        NST.on('', (d) => console.log(`>>>> ${d.path} | ${d.key} | ${d.value}`, d))

        //$ reset the store to trigger emitAll
        NST.reset()

        

    })

    it('D.4 | Wildcards listen to changes of any nested state', () => {
        const NST = nestore({
            person: {
                name: 'John',
                age: 88
            },
            buiding: {
                owner: 'Alice',
                type: 'House',
                stats: {
                    sqft: 5134,
                    floors: 3
                }
            }
        })

        let recievedEvents = []

        //$ Register events
        NST.on('person.*', (data) => recievedEvents.push(`person.* = ${data.value}`))
        NST.on('buildng:.', (data) => recievedEvents.push(`building.* = ${data.value}`))
        


        //$ set and emit events
        NST.set('person.name', 'Brad')
        NST.set('person.age', '54')
   
        
        
        //$ events should include A B C D E from setters
        expect(recievedEvents).to.include('person.* = Brad')      
        expect(recievedEvents).to.include('person.* = 54')      
        // console.log(recievedEvents)  
        // console.log(NST.store)
            

    })

});
