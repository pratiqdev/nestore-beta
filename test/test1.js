import assert from 'assert'
import nestore from '../index.js'
import chai from 'chai';
import fs from 'fs'
const __dir = await fs.promises.realpath('.')
const testStatsFile = __dir + '/test/test-results.json'

chai.config.truncateThreshold = 1500; // disable truncating
const { expect } = chai

const heading = (text) => `${text}\n  ${'-'.repeat(text.length)}`

// const GLOBAL_NST = nestore({ global: true })

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

const testResults = JSON.parse(await fs.promises.readFile(testStatsFile, { encoding: 'utf-8'}))





describe(heading('A | Setup'), () => {

    it('A.1 | Creates a filled store that returns store and methods', () => {
        const NST = nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });
    
    it('A.2 | Creates an empty store that returns store and methods', () => {
        const NST = nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });
    
    it('A.3 | Store matches initialStore on start', () => {
        const NST = nestore(initialStore)
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    })

    it('A.4 | Mutliple stores do not modify each other', () => {
        const A = nestore({ name: 'Alice'})
        const B = nestore({ name: 'Bob'})

        expect(A.get('name')).to.eq('Alice')
        expect(B.get().name).to.eq('Bob')
        // assert(A.get().name === 'Alice')
        // assert(B.get().name === 'Bob')
        
        A.set('name', 'Andrew')
        expect(A.get().name).to.eq('Andrew')
        expect(B.get().name).to.eq('Bob')
        // assert(A.get().name === 'Andrew')
        // assert(B.get().name === 'Bob')

        B.set('name', 'Becky')
        expect(A.get().name).to.eq('Andrew')
        expect(B.get().name).to.eq('Becky')
        // assert(A.get().name === 'Andrew')
        // assert(B.get().name === 'Becky')
        
    })

    it('A.5 | Passing existing nestore to nestore returns original', () => {
        const A = nestore({ name: 'Alice'})
        const B = nestore(A)

        expect(A.get().name).to.eq('Alice')
        expect(B.get().name).to.eq('Alice')
        
        A.set('name', 'Andrew')
        expect(A.get().name).to.eq('Andrew')
        expect(B.get().name).to.eq('Andrew')

        B.set('name', 'Becky')
        expect(A.get().name).to.eq('Becky')
        expect(B.get().name).to.eq('Becky')
        
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
        const NST = nestore(initialStore)

        expect(NST.get('title') ).to.eq( initialStore.title)
        expect(NST.get('pages') ).to.eq( initialStore.pages)
        expect(NST.get('checkedOut') ).to.eq( initialStore.checkedOut)
        expect(NST.get('chapters[2]') ).to.eq( initialStore.chapters[2])
        expect(NST.get('reviews.someGuy') ).to.eq( initialStore.reviews.someGuy)
        expect(NST.get('reviews["Some Guy"]') ).to.eq( initialStore.reviews['Some Guy'])
        expect(NST.get('reviews["Some Extra"]["Stuff Here"].find["me ?"]') ).to.eq( initialStore.reviews["Some Extra"]["Stuff Here"].find["me ?"])
    })

    it('B.2 | Get string method returns undefined on incorrect path', () => {
        const NST = nestore(initialStore)

        assert(typeof NST.get('frobble') === 'undefined')
        assert(typeof NST.get('pages.frizzle') === 'undefined')
        assert(typeof NST.get('thingy.jimjam') === 'undefined')
    })

    it('B.3 | Get callback method returns correct value', () => {
        const NST = nestore(initialStore)

        // assert(get(s => s) === initialStore)
        expect(JSON.stringify(NST.get(s => s))).to.eq(JSON.stringify(initialStore))
        // assert(get(s => s.title) === initialStore.title)

    })

    it('B.4 | Get callback method returns undefined on incorrect path', () => {
        const { get, set, reset, store } = nestore(initialStore)

        assert(typeof get(s => s.brapple) === 'undefined')
        assert(typeof get(s => s.fimble.famble) === 'undefined')
        assert(typeof get(s => s.fimble.famble['dongle']) === 'undefined')

    })

    it('B.5 | Get method with no args returns entire store', () => {
        const NST = nestore(initialStore)

        // assert(get() === initialStore)
        expect(JSON.stringify(NST.get()))
        .to.eq(JSON.stringify(initialStore))

    })

})

describe(heading('C | Set'), () => {

    it('C.1 | Set method changes existing values', () => {
        const NST = nestore(initialStore)

        NST.set('title', 'The Best Book Ever')
        assert(NST.get('title') === 'The Best Book Ever')
        
    })
    
    it('C.2 | Set method assigns new key-values', () => {
        const NST = nestore(initialStore)

        NST.set('brimple', 'boop')
        expect(NST.get('brimple')).to.eq('boop')
        
        NST.set('dap.bap','tap')
        expect(NST.get('dap.bap')).to.eq('tap')
        
    })

    it('C.3 | Set method should with no args should return false', () => {
        const NST = nestore(initialStore)

        assert( NST.set() === false )
        assert( NST.set('thing') === false )
        assert( NST.set('thing', 'blap') === true )
    })

    // it.skip('C.4 | (set cb is deprecated) Set callback method should set correct values', () => {
    //     const { get, set, reset, store } = nestore(initialStore)

    //     set(s => s.title = '12345')
    //     expect(get('title')).to.eq('12345')

    // })

    it('C.4 | Direct store modifications dont affect internal store', () => {
        const NST = nestore(initialStore)

        NST.on('title', ()=> console.log('store was updated...'))

        NST.get().title = '98765'
        NST.get().thangy = 'woop'

        expect( NST.get('title') )
            .to.not.eq( '98765' )
        
        expect( NST.get('thangy') )
            .to.not.eq( 'woop' )
            




    })

    // it('C.5 | Direct store modifications affect internal store with mutable enabled', () => {
    //     const NST = nestore(initialStore, { mutable: true })

    //     NST.on('title', ()=> console.log('store was updated...'))

    //     NST.get().title = '98765'
    //     NST.get().thangy = 'woop'

    //     expect( NST.get('title') )
    //         .to.eq( '98765' )
        
    //     expect( NST.get('thangy') )
    //         .to.eq( 'woop' )
            




    // })

    it('C.5 | Object passed to set() should override internal store', () => {
        const NST = nestore(initialStore)

        NST.set({
            internalStore: 'override'
        })


        expect( NST.get('internalStore') )
            .to.eq( 'override' )
        




    })

});

describe(heading('D | Remove'), () => {

    it('D.1 | Removing values deletes the key:value from the store', () => {
        const NST = nestore(initialStore)
        NST.remove('title')
        expect(typeof NST.get('title')).to.eq('undefined')
    })

    it('D.2 | Removing values emits event with undefined value', () => {
        const NST = nestore(initialStore)
        let events = null

        NST.on('title', (data) => {
            events = JSON.stringify(data)
        })

        NST.remove('title')
        expect(events).to.eq(JSON.stringify({ path: 'title', key: 'title', value: undefined}))
    })

});

describe(heading('E | Events'), () => {

    it('E.1 | Uses all available wildcards and nested access methods', async () => {
        const NST = nestore(initialStore)

        let recievedEvents = []

        let setters = [
            'title',
            'reviews.someGuy',
            'reviews.Some Guy',
            'reviews.Some Extra.Stuff Here',
            'chapters.0',
            'chapters.1',
            'chapters.2',
        ]

   
        let validList = [
            'title',    // The Book
            'reviews.*',
            'reviews.**',
            'chapters.*',
            '*',
            ''
        ]
        
        let invalidList = [
            'title.*',  // null
            'reviews',
            'reviews:*',
            'reviews*',
            'reviews/',
            'reviews/*',
        ]

        let list = [...validList, ...invalidList]

        list.forEach(k => {
            NST.on(k, () => recievedEvents.push(k))
        })

        setters.forEach(s => {
            NST.set(s, 'was-set')
        })


        // console.log(recievedEvents)

        assert( recievedEvents.every(evnt => !invalidList.includes(evnt)) )


        
        
        // setTimeout(()=>{
        //     done()
        // }, 1500)
    })

    it('E.2 | Changes to the store made with `set()` emit events', async () => {
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

    it('E.3 | Resetting store emits events for every key', () => {
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
        NST.on('/', (data) => recievedEvents.push(`reset = store`))


        //$ set and emit events
        NST.set('A', 'apple')
        NST.set('B', 'banana')
        NST.set('C', 'cherry')
        NST.set('D', 'donut')
        NST.set('E', 'eclair')


        //$ reset the store to trigger emitAll
        NST.reset()

        // console.log(recievedEvents)
        
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

    it('E.4 | EmitAll emits events with correct paths', () => {

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

        const NST = nestore(sto, {delimiter: '/'})

        NST.on('', (d) => recievedEvents.push(d))

        //$ reset the store to trigger emitAll
        NST.reset()

        // console.log(recievedEvents)

        
        const str = JSON.stringify(recievedEvents)
        
        const match = (val) => expect(str).to.include(JSON.stringify(val))

        match({path: 'title', key: 'title', value: 'The Book'})
        match({path: 'pages', key: 'pages', value: 817})
        match({path: 'checkedOut', key: 'checkedOut', value: false})

        match({path: 'chapters', key: 'chapters', value: ['1-The Start', '2-The Middle', '3-The End']})
        match({path: 'chapters/0', key: '0', value: '1-The Start'})
        match({path: 'chapters/1', key: '1', value: '2-The Middle'})
        match({path: 'chapters/2', key: '2', value: '3-The End'})

        match({ path: 'flaps', key: 'flaps', value: [ 'AAA', 'BBB', ['xxx', 'yyy', 'zzz'] ] },)
        match({path: 'flaps/0', key: '0', value: 'AAA'})
        match({path: 'flaps/1', key: '1', value: 'BBB'})
        match({path: 'flaps/2/0', key: '0', value: 'xxx'})
        match({path: 'flaps/2/1', key: '1', value: 'yyy'})
        match({path: 'flaps/2/2', key: '2', value: 'zzz'})

        match({
            path: 'reviews',
            key: 'reviews',
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
        match({path: 'reviews/someGuy', key: 'someGuy', value: 'This is a book'})
        match({path: 'reviews/Some Extra/stuff', key: 'stuff', value: 'here!'})
        match({path: 'reviews/Some Guy', key: 'Some Guy', value: 'This book was... okay.'})

    })

    it('E.5 | Wildcards listen to changes of any nested state', () => {
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
        NST.on('', (data) => recievedEvents.push(`"*" = ${JSON.stringify(data)}`))
        NST.on('*', (data) => recievedEvents.push(`"*" = ${JSON.stringify(data)}`))
        NST.on('person', (data) => recievedEvents.push(`"person" = ${data.key} => ${data.value}`))
        NST.on('person.', (data) => recievedEvents.push(`"person" = ${data.key} => ${data.value}`))
        NST.on('person/*', (data) => recievedEvents.push(`"person/*" = ${data.key} => ${data.value}`))
        NST.on('person.*', (data) => recievedEvents.push(`person.* = ${data.value}`))
        

        
        
        //$ set and emit events
        NST.set('person.name', 'Brad')
        NST.set('person.age', '54')
   
        
        // console.log(recievedEvents)
        
        //$ events should include A B C D E from setters
        expect(recievedEvents).to.include('person.* = Brad')      
        expect(recievedEvents).to.include('person.* = 54')      
        // console.log(recievedEvents)  
        // console.log(NST.get())
            

    })

    it('E.6 | Events have matching structs with normalized path', () => {
        const NST = nestore({
            person: {
                name: 'John',
                age: 88
            },
            building: {
                owner: 'Alice',
                type: 'House',
                stats: {
                    sqft: 5134,
                    floors: 3
                }
            },
            weekdays: ['monday', 'tuesday', 'wednesday']
        })

        let recievedEvents = []

        //$ Register events
        NST.on('person.*', (data) => recievedEvents.push(JSON.stringify(data)))
        //! double wildcard required for "building.stats.sqft"
        NST.on('building.**', (data) => recievedEvents.push(JSON.stringify(data)))




        //$ set and emit events
        NST.set('person.name', 'Brad')
        NST.set('person/age', 54)
        NST.set('person/nickname', 'Bradlington')

        NST.set('building.owner', 'Bobby')
        NST.set('building.type', 'Residential')
        NST.set('building/stats.sqft', 5250)
        
        NST.reset()
   
        
        // console.log(recievedEvents)  
        
        //$ from setter
        expect(recievedEvents).to.include(JSON.stringify({ path: 'person.name', key: 'name', value: 'Brad' }))      
        expect(recievedEvents).to.include(JSON.stringify({ path: 'person.age', key: 'age', value: 54 }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'person.nickname', key: 'nickname', value: 'Bradlington' }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.owner', key: 'owner', value: 'Bobby' }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.type', key: 'type', value: 'Residential' }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.stats.sqft', key: 'sqft', value: 5250 }))  

        //$ from reset
        expect(recievedEvents).to.include(JSON.stringify({ path: 'person.name', key: 'name', value: 'John' }))      
        expect(recievedEvents).to.include(JSON.stringify({ path: 'person.age', key: 'age', value: 88 }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.owner', key: 'owner', value: 'Alice' }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.type', key: 'type', value: 'House' }))  
        expect(recievedEvents).to.include(JSON.stringify({ path: 'building.stats.sqft', key: 'sqft', value: 5134 }))  
        
        
        //! Keys that no longer exist will no emit events!
        // expect(recievedEvents).to.include(JSON.stringify({ path: 'person.nickname', key: 'nickname', value: 'Bradlington' }))  
            

    })


});

describe(heading('F | Mutability'), () => {

    it('F.1 | No methods return a reference that can mutate the store', async () => {
        const NST = nestore(initialStore)

        let recievedEvents = []

        let setters = [
            'title',
            'reviews.someGuy',
            'reviews.Some Guy',
            'reviews.Some Extra.Stuff Here',
            'chapters.0',
            'chapters.1',
            'chapters.2',
        ]

   
        let validList = [
            'title',    // The Book
            'reviews.*',
            'reviews.**',
            'chapters.*',
            '*',
            ''
        ]
        
        let invalidList = [
            'title.*',  // null
            'reviews',
            'reviews:*',
            'reviews*',
            'reviews/',
            'reviews/*',
        ]

        let list = [...validList, ...invalidList]

        list.forEach(k => {
            NST.on(k, () => recievedEvents.push(k))
        })

        setters.forEach(s => {
            NST.set(s, 'was-set')
        })


        // console.log(recievedEvents)

        assert( recievedEvents.every(evnt => !invalidList.includes(evnt)) )


        
        
        // setTimeout(()=>{
        //     done()
        // }, 1500)
    })


});


describe(heading('Performance'), function(){
    this.timeout(60_000)

    after(function(){
        fs.promises.writeFile(testStatsFile, JSON.stringify(testResults, null, 2))
        console.log('\tPerformance tests complete.')
        console.log('\tWrote result data to stat file: "test-results.json"')
    })

    beforeEach(function(){
        console.log('')
    })

    let defaultMap = new Map()

    let OPERATION_LIMIT = 10_000
    let CYCLE_LIMIT = 100
    let MAX_AVG_OP_TIME = 0.02
    let MAX_STAT_HISTORY = 5
    let enableLogging = true


    let set = 'ABCDEF'
    const average = array => array.reduce((a, b) => a + b) / array.length;
    const min = array => Math.min(...array)
    const max = array => Math.max(...array)
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

    const handleOutput = (test, opTime, startTime, durationArr, done) => {
        if(!testResults[test]){
            testResults[test] = []
        }
        
        testResults[test].push(opTime)
        if(testResults[test].length > MAX_STAT_HISTORY + 1){
            testResults[test].shift()
        }
        
        if(!enableLogging) return done()

        console.log(`\n\t`+'.'.repeat(50))
        // console.log(`\tTotal cycles               : ${CYCLE_LIMIT}`)
        console.log(`\tTotal test duration        : ${Date.now() - startTime} ms`)
        // console.log(`\tTotal operations           : ${smallNum(CYCLE_LIMIT * OPERATION_LIMIT)}`)
        console.log(`\tAverage time per operation : ${opTime + ''.substring(0,6)} ms`)
        // console.log(`\tDurations at start / end   : ${durationArr[0]} / ${durationArr[durationArr.length - 1]} `)
        // console.log(`\tDifference start / end     : ${((durationArr[durationArr.length - 1] - durationArr[0]) + '').substring(0,6)} ms`)
        console.log(`\tAverage cycle duration     : ${average(durationArr)} ms`)
        // console.log(`\tMaximum cycle duration     : ${max(durationArr)} ms`)
        // console.log(`\tMinimum cycle duration     : ${min(durationArr)} ms`)

        
        let thisStats = testResults[test]

        if(thisStats.length < MAX_STAT_HISTORY){
            console.log('\tNot enough historical data to graph...')
            console.log('\t'+'.'.repeat(50) + '\n')
            return done()
        }

        let _max = Math.max(...thisStats)
        let _min = Math.min(...thisStats)

        let stepSize = (_max - _min) / 10

        // console.log(`\tMax historical score: `, (_max + '').substring(0,5) )
        // console.log(`\tMin historical score: `, (_min + '').substring(0,5) )
        console.log(`\tLast score:`, thisStats[thisStats.length - 1])
        
        // console.log('\t'+'.'.repeat(50) + '\n')
        console.log('')



        let i = 0

        while(i < thisStats.length - 1){
            let str = '\t'
            i++

            let diff = thisStats[i] - thisStats[i - 1]
            diff = diff > 0 ? '+' : '-'

            str += `${diff} | `
            str += `${(thisStats[i] + '').substring(0,7)}  |`
            str += `||`.repeat( ((thisStats[i] - _min) / stepSize) + 1 )
            
            console.log(str)
        }
        console.log('\t'+'.'.repeat(50) + '\n')

        done()

    }

    console.log(`\tOperation limit: ${OPERATION_LIMIT * CYCLE_LIMIT}`)

    
    it('PERF.1 | set', (done) => {
        console.log('\tPERF.1 | set')
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []

        const NST = nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)
                NST.set(key, val)
                // assert(NST.get(key) === val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)
   
        handleOutput('PERF.1', avgOpTime, TEST_START, durationArr, done)
        
    })

    it('PERF.2 | get', (done) => {
        console.log('\tPERF.2 | get')

        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)
                NST.get(key)
                // assert(NST.get(key) === val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)

            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.2', avgOpTime, TEST_START, durationArr, done)

    })

    it('PERF.3 | get random', (done) => {
        console.log('\tPERF.3 | get random')
        
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                let res = NST.get(key)
                assert(res === val || res === undefined)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)

            // enableLogging && console.log(`\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.3', avgOpTime, TEST_START, durationArr, done)


    })

    it('PERF.4 | set => get', (done) => {
        console.log('\tPERF.4 | set => get')
        
        // let OPERATION_LIMIT = 100
        // let CYCLE_LIMIT = 10
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                NST.set(key, val)
                // let g = '1'
                NST.get(key)
                // expect(g).to.eq(val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.4', avgOpTime, TEST_START, durationArr, done)

        
        
        

    })

    it('PERF.5 | default map comparison : set => get', (done) => {
        console.log('\tPERF.5 | default map comparison : set => get')
        
        // let OPERATION_LIMIT = 1
        // let CYCLE_LIMIT = 10
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                // let g = '1'
                defaultMap.set(key, val)
                expect(defaultMap.get(key)).to.eq(val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)


            // enableLogging && console.log(`\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.5', avgOpTime, TEST_START, durationArr, done)

    })


  


    // it('PERF STATS - output', ()=>{
    //     fs.promises.writeFile(testStatsFile, JSON.stringify(testResults, null, 2))
    //     console.log('Wrote to stat file...')
    // })
    
});