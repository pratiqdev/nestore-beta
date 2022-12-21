import {
    nestore,
    __dir,
    heading,
    expect,
    initialStore
} from '../utils.js'



describe(heading('F | In Store Setters'), () => {

    it('F.1 | setterA', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        let res = NST.setterTestA()
        expect(res).to.eq(undefined)

        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('F.2 | setterB', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        let res = NST.setterTestB()
        expect(res).to.eq(true)

        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('F.3 | setterC', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        let res = NST.setterTestC('hello', 'world')
        expect(res[0]).to.eq('hello')
        expect(res[1]).to.eq('world')

        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('F.4 | setterD', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        NST.setterTestD()
        expect(NST.get('setter-test-d')).to.eq(true)

        expect( recievedEvents.length ).to.eq( 1 )
        
    })

    it('F.5 | setterE', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        let res = NST.setterTestE('title')
        expect(res).to.eq('The Book')

        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('F.6 | setterF', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        let pages = NST.get('pages')
        let res = NST.setterTestF()

        expect(res).to.eq(pages + 1)
        expect(NST.get('pages')).to.eq(pages + 1)

        expect( recievedEvents.length ).to.eq( 1 )
        
    })


    it('F.7 | setterG', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))
        // console.log('>>> calling setter G')
        let res = await NST.setterTestG()
        
        // console.log('>>> asserting values')
        expect(res).to.eq('async_success')
        expect(NST.get('async')).to.eq(true)

        expect( recievedEvents.length ).to.eq( 1 )
        return true
    })

    it('F.8 | setterH', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))
        // console.log('>>> calling setter G')
        let res = await NST.setterTestH()
        
        // console.log('>>> asserting values')
        expect(res).to.eq('7_7')
        expect(NST.get('async')).to.eq(77)

        expect( recievedEvents.length ).to.eq( 1 )
        return true
    })

});
