import {
    nestore,
    __dir,
    heading,
    expect,
    initialStore,
} from '../utils.js'


describe(heading('I | Mutability / Silent Updates'), () => {

    it('I.1 | NST.get() => store.* = X', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        NST.store.title = 'aaa'
        expect(NST.get('title')).to.eq('aaa')
        expect(NST.store.title).to.eq('aaa')

        // no events should be emitted from direct mutations, if they happen
        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('I.2 | NST.store.* = X', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        NST.store.title = 'bbb'
        expect(NST.get('title')).to.eq('bbb')
        expect(NST.store.title).to.eq('bbb')

        // no events should be emitted from direct mutations, if they happen
        expect( recievedEvents.length ).to.eq( 0 )
        
    })

    it('I.3 | setter((x) => x.get() => .store.* = X)', async () => {
        const NST = await nestore(initialStore)

        NST.on('@ready',  () => {
            
            let recievedEvents = []
            NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))
            
            NST.mutabilityTestA('ccc')
            expect(NST.get('title')).to.eq('ccc')
            expect(NST.store.title).to.eq('ccc')
            
            // no events should be emitted from direct mutations, if they happen
            expect( recievedEvents.length ).to.eq( 0 )
        })
        
    })

    it('I.4 | setter((x) => x.store.* = X)', async () => {
        const NST = await nestore(initialStore)

        NST.on('@ready', () => {

            let recievedEvents = []
            NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))
            
            NST.mutabilityTestB('ddd')
            expect(NST.get('title')).to.eq('ddd')
            expect(NST.store.title).to.eq('ddd')
            
            // no events should be emitted from direct mutations, if they happen
            expect( recievedEvents.length ).to.eq( 0 )
        })
        
    })

    it('I.5 | NST.get("path") = X', async () => {
        const NST = await nestore(initialStore)

        let recievedEvents = []
        NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

        NST.store.title = 'eee'
        expect(NST.get('title')).to.eq('eee')
        expect(NST.store.title).to.eq('eee')

        // no events should be emitted from direct mutations, if they happen
        expect( recievedEvents.length ).to.eq( 0 )
        
    })

});
