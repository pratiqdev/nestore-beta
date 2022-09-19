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

        // assert(store === initialStore)
        assert(typeof store === typeof initialStore)
        assert(JSON.stringify(store) === JSON.stringify(initialStore))
    })

    it('A.4 | Mutliple stores do not modify each other', () => {
        const A = nestore({ name: 'Alice'})
        const B = nestore({ name: 'Bob'})

        expect(A.store.name).to.eq('Alice')
        expect(B.store.name).to.eq('Bob')
        // assert(A.store.name === 'Alice')
        // assert(B.store.name === 'Bob')
        
        A.set('name', 'Andrew')
        expect(A.store.name).to.eq('Andrew')
        expect(B.store.name).to.eq('Bob')
        // assert(A.store.name === 'Andrew')
        // assert(B.store.name === 'Bob')

        B.set('name', 'Becky')
        expect(A.store.name).to.eq('Andrew')
        expect(B.store.name).to.eq('Becky')
        // assert(A.store.name === 'Andrew')
        // assert(B.store.name === 'Becky')
        
    })

    it('A.5 | Passing existing nestore to nestore returns original', () => {
        const A = nestore({ name: 'Alice'})
        const B = nestore(A)

        expect(A.store.name).to.eq('Alice')
        expect(B.store.name).to.eq('Alice')
        
        A.set('name', 'Andrew')
        expect(A.store.name).to.eq('Andrew')
        expect(B.store.name).to.eq('Andrew')

        B.set('name', 'Becky')
        expect(A.store.name).to.eq('Becky')
        expect(B.store.name).to.eq('Becky')
        
    })

    it('A.6 | Nestore does not provide access to internal methods', () => {
        const NST = nestore({ name: 'Alice'})

        expect(typeof NST.keyCount).to.eq('undefined')
        // expect(typeof NST.#emit).to.eq('undefined')
        // expect(typeof NST.#handleEmitAll).to.eq('undefined')
        // expect(typeof NST.#splitPath).to.eq('undefined')
        // expect(typeof NST.#splitPathToKey).to.eq('undefined')
        
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

        // assert(get(s => s) === initialStore)
        expect(JSON.stringify(get(s => s))).to.eq(JSON.stringify(initialStore))
        // assert(get(s => s.title) === initialStore.title)

    })

    it('B.4 | Get callback method returns undefined on incorrect path', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(typeof get(s => s.brapple) === 'undefined')
        assert(typeof get(s => s.fimble.famble) === 'undefined')
        assert(typeof get(s => s.fimble.famble['dongle']) === 'undefined')

    })

    it('B.5 | Get method with no args returns entire store', () => {
        const { get, set, reset, store } = nestore(initialStore)

        // assert(get() === initialStore)
        expect(JSON.stringify(get()))
        .to.eq(JSON.stringify(initialStore))

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
        expect(get('brimple')).to.eq('boop')
        
        set('dap.bap','tap')
        expect(get('dap.bap')).to.eq('tap')
        
    })

    it('C.3 | Set method should with no args should return false', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert( set() === false )
        assert( set('thing') === false )
        assert( set('thing', 'blap') === true )
    })

    it.skip('C.4 | (set cb is deprecated) Set callback method should set correct values', () => {
        const { get, set, reset, store } = nestore(initialStore)

        set(s => s.title = '12345')
        expect(get('title')).to.eq('12345')

    })

    it('C.5 | Direct store modifications dont affect internal store with directMod disabled', () => {
        const NST = nestore(initialStore)

        NST.on('title', ()=> console.log('store was updated...'))

        NST.store.title = '98765'
        NST.store.thangy = 'woop'

        expect( NST.get('title') )
            .to.not.eq( '98765' )
        
        expect( NST.get('thangy') )
            .to.not.eq( 'woop' )
            




    })

    it('C.6 | Direct store modifications affect internal store with directMod enabled', () => {
        const NST = nestore(initialStore, { allowDirectModification: true })

        NST.on('title', ()=> console.log('store was updated...'))

        NST.store.title = '98765'
        NST.store.thangy = 'woop'

        expect( NST.get('title') )
            .to.eq( '98765' )
        
        expect( NST.get('thangy') )
            .to.eq( 'woop' )
            




    })

    it('C.7 | Object passed to set() should override internal store', () => {
        const NST = nestore(initialStore)

        NST.set({
            internalStore: 'override'
        })


        expect( NST.get('internalStore') )
            .to.eq( 'override' )
        




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


    it('D.3 | EmitAll emits events with correct paths', () => {

        const recievedEvents = []

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

        NST.on('', (d) => recievedEvents.push(d))

        //$ reset the store to trigger emitAll
        NST.reset()

        // console.log(recievedEvents)

        
        const str = JSON.stringify(recievedEvents)
        
        const match = (val) => expect(str).to.include(JSON.stringify(val))

        match({key: 'title', path: 'title', value: 'The Book'})
        match({key: 'pages', path: 'pages', value: 817})
        match({key: 'checkedOut', path: 'checkedOut', value: false})

        match({key: 'chapters', path: 'chapters', value: ['1-The Start', '2-The Middle', '3-The End']})
        match({key: '0', path: 'chapters/0', value: '1-The Start'})
        match({key: '1', path: 'chapters/1', value: '2-The Middle'})
        match({key: '2', path: 'chapters/2', value: '3-The End'})

        match({ key: 'flaps', path: 'flaps', value: [ 'AAA', 'BBB', ['xxx', 'yyy', 'zzz'] ] },)
        match({key: '0', path: 'flaps/0', value: 'AAA'})
        match({key: '1', path: 'flaps/1', value: 'BBB'})
        match({key: '0', path: 'flaps/2/0', value: 'xxx'})
        match({key: '1', path: 'flaps/2/1', value: 'yyy'})
        match({key: '2', path: 'flaps/2/2', value: 'zzz'})

        match({
            key: 'reviews',
            path: 'reviews',
            value: {
              someGuy: 'This is a book',
              'Some Extra': {
                stuff: 'here!'
              },
              'Some Guy': 'This book was... okay.',
              more_stuff_here: {
                find: {
                    'me ?': 'Hello!'
                }
              },
              'Big Name': 'Best book ever in the world always.'
            }
          },)
        match({key: 'someGuy', path: 'reviews/someGuy', value: 'This is a book'})
        match({key: 'stuff', path: 'reviews/Some Extra/stuff', value: 'here!'})
        match({key: 'Some Guy', path: 'reviews/Some Guy', value: 'This book was... okay.'})

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

describe(heading('E | Utilities'), () => {

    it('E.1 | Returns the correct "entries"', async () => {
        const NST = nestore(initialStore)
        expect(JSON.stringify(NST.entries)).to.eq(JSON.stringify(Object.entries(initialStore)))
    })

    it('E.2 | Returns the correct "keys"', async () => {
        const NST = nestore(initialStore)
        expect(JSON.stringify(NST.keys)).to.eq(JSON.stringify(Object.keys(initialStore)))
    })

    it('E.3 | Returns the correct "values"', async () => {
        const NST = nestore(initialStore)
        expect(JSON.stringify(NST.values)).to.eq(JSON.stringify(Object.values(initialStore)))
    })

    it('E.4 | Returns the correct "length"', async () => {
        const NST = nestore(initialStore)
        expect(NST.entries.length).to.eq(Object.entries(initialStore).length)
        expect(NST.keys.length).to.eq(Object.entries(initialStore).length)
        expect(NST.values.length).to.eq(Object.entries(initialStore).length)
    })

    it('E.5 | Returns the correct "paths"', async () => {
        const _NST = nestore(initialStore)
        // console.log(_NST.paths)

        expect(_NST.paths.length).to.eq(16)

        expect(_NST.paths).to.include('/')
        expect(_NST.paths).to.include('title')
        expect(_NST.paths).to.include('pages')
        expect(_NST.paths).to.include('checkedOut')
        expect(_NST.paths).to.include('chapters')
        expect(_NST.paths).to.include('chapters/0')
        expect(_NST.paths).to.include('chapters/1')
        expect(_NST.paths).to.include('chapters/2')
        expect(_NST.paths).to.include('reviews')
        expect(_NST.paths).to.include('reviews/someGuy')
        expect(_NST.paths).to.include('reviews/Some Guy')
        expect(_NST.paths).to.include('reviews/Big Name')
        expect(_NST.paths).to.include('reviews/Some Extra')
        expect(_NST.paths).to.include('reviews/Some Extra/Stuff Here')
        expect(_NST.paths).to.include('reviews/Some Extra/Stuff Here/find')
        expect(_NST.paths).to.include('reviews/Some Extra/Stuff Here/find/me ?')
    })

   

});

describe.skip(heading('Performance'), function(){
    this.timeout(60_000 * 5)
    

    it('E.1 | Bulk changes to the store should complete within 60s', async (done) => {
        let TEST_START = Date.now()

        const NST = nestore()

        let NUM_OF_OPERATIONS = 0
        let OPERATION_LIMIT = 100_000
        let CYCLE_LIMIT = 10
        let NUM_OF_CYCLES = 0

        let durationArr = []
        const average = array => array.reduce((a, b) => a + b) / array.length;
        const min = array => Math.min(...array)
        const max = array => Math.max(...array)

        let set = 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ1234567890_____-----'
        let randStr = (val = 8) => {
            let str = ''
            while(str.length < val){
                str += set[Math.floor(Math.random() * set.length)]
            }
            return str
        }

        let smallNum = (num) => {
            num += ''
            let l = num.length
            if(l > 3 && l <= 6) return num.substring(0,l-3) + ' K'
            else if(l > 6 && l <= 9) return num.substring(0,l-6) +'.'+ num.substring(l-6,l-4) + ' M'
            else if(l > 9 && l <= 12) return num.substring(0,l-9) +'.'+ num.substring(l-9,l-7) + ' B'
            else if(l > 12 && l <= 15) return num.substring(0,l-12) +'.'+ num.substring(l-12,l-10) + ' T'
            else return num
        }
        

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
    
                NST.set(key, val)
                assert(NST.get(key) === val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            console.log(`\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }

        console.log(`\n\t`+'.'.repeat(50))
        console.log(`\tTotal cycles               : ${CYCLE_LIMIT}`)
        console.log(`\tTotal test duration        : ${Date.now() - TEST_START} ms`)
        console.log(`\tTotal operations           : ${smallNum(NST.keyCount)} keys`)
        console.log(`\tAverage time per operation : ${((average(durationArr) / OPERATION_LIMIT) + '').substring(0,6)} ms`)
        console.log(`\tAverage cycle duration     : ${average(durationArr)} ms`)
        console.log(`\tMaximum cycle duration     : ${max(durationArr)} ms`)
        console.log(`\tMinimum cycle duration     : ${min(durationArr)} ms`)
        console.log('\t'+'.'.repeat(50) + '\n')

        
        expect(NST.keyCount).to.be.greaterThanOrEqual((OPERATION_LIMIT * NUM_OF_CYCLES) / 2)
        done()

    })


});
