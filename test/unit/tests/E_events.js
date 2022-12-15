import {
    Nestore,
    __dir,
    heading,
    expect,
    assert,
    initialStore
} from '../utils.js'




describe(heading('E | Events'), () => {

    it('E.1 | Uses all available wildcards and nested access methods', async () => {
        const NST = new Nestore(initialStore)

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
        const NST = new Nestore(initialStore)

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
        const NST = new Nestore({
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

        const NST = new Nestore(sto, {delimiter: '/'})

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
        const NST = new Nestore({
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
        const NST = new Nestore({
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

    // dont test ee2 methods
    // it('E.7 | Emitter.once() fires correct amount', () => {
    //     const NST = new Nestore({
    //         greeting: 'hello'
    //     })

    //     let recievedEvents = []

    //     //$ Register events
    //     NST.once('greeting', (data) => recievedEvents.push(JSON.stringify(data)))


    //     //$ set and emit events
    //     NST.set('greeting', 'Yo')
    //     NST.set('greeting', 'Oi')
    //     NST.set('greeting', 'Ay')

    //     NST.reset()

    //     expect(recievedEvents.length).to.eq(1)

    // })

    // it('E.8 | Emitter.many() fires correct amount', () => {
    //     const NST = new Nestore({
    //         greeting: 'hello'
    //     })

    //     let recievedEvents = []

    //     //$ Register events
    //     NST.many('greeting', 3, (data) => recievedEvents.push(JSON.stringify(data)))


    //     //$ set and emit events
    //     NST.set('greeting', 'Yo')
    //     NST.set('greeting', 'Oi')
    //     NST.set('greeting', 'Ay')
    //     NST.set('greeting', 'Yuh')
    //     NST.set('greeting', 'Fuyo')

    //     NST.reset()

    //     expect(recievedEvents.length).to.eq(3)

    // })


});
