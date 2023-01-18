import {
    nestore,
    __dir,
    heading,
    expect,
    assert,
    initialStore
} from '../utils.js'




describe(heading('C | Set'), () => {

    it('C.1 | Set method changes existing values', async () => {
        const NST = await nestore(initialStore)

        NST.set('title', 'The Best Book Ever')
        assert(NST.get('title') === 'The Best Book Ever')
        
    })
    
    it('C.2 | Set method assigns new key-values', async () => {
        const NST = await nestore(initialStore)

        NST.set('brimple', 'boop')
        expect(NST.get('brimple')).to.eq('boop')
        
        NST.set('dap.bap','tap')
        expect(NST.get('dap.bap')).to.eq('tap')
        
    })

    it('C.3 | Set method should should return false with no args', async () => {
        const NST = await nestore(initialStore)

        expect( NST.set() ).to.eq(false)
        expect( NST.set('thing') ).to.eq(false)
        expect( NST.set('thing', 'blap') ).to.eq(true)

    })

    // it.skip('C.4 | (set cb is deprecated) Set callback method should set correct values', async () => {
    //     const { get, set, reset, store } = await nestore(initialStore)

    //     set(s => s.title = '12345')
    //     expect(get('title')).to.eq('12345')

    // })

    it('C.4 | Direct store modifications mutate the internal store', async () => {
        const NST = await nestore(initialStore)

        NST.on('title', ()=> console.log('store was updated...'))

        NST.store.title = '98765'
        NST.store.thangy = 'woop'

        expect( NST.get('title') )
            .to.eq( '98765' )
        
        expect( NST.get('thangy') )
            .to.eq( 'woop' )

    })

    // it('C.5 | Direct store modifications affect internal store with mutable enabled', async () => {
    //     const NST = await nestore(initialStore, { mutable: true })

    //     NST.on('title', ()=> console.log('store was updated...'))

    //     NST.get().title = '98765'
    //     NST.get().thangy = 'woop'

    //     expect( NST.get('title') )
    //         .to.eq( '98765' )
        
    //     expect( NST.get('thangy') )
    //         .to.eq( 'woop' )
            




    // })

    it('C.5 | Object passed to set() should override internal store', async () => {
        const NST = await nestore(initialStore)

        NST.set({
            internalStore: 'override'
        })


        expect( NST.get('internalStore') )
            .to.eq( 'override' )
        




    })

    it('C.6 | Setter functions passed to set should be invoked with the current value and set new value', async () => {
        const NST = await nestore({
            say: 'hello'
        })

        await NST.set('say', (text) => {
            return text + ' world'
        })


        expect( NST.get('say') )
            .to.eq( 'hello world' )
        




    })

    it('C.7 | Emits updates for repeated matching events when preventRepeatUpdates = false', async () => {
        const NST = await nestore(initialStore, {
            preventRepeatUpdates: false
        })
        let count = 0
        NST.on('title', async () => count++)

        NST.set('title', 'Frank')
        NST.set('title', 'Frank')
        NST.set('title', 'Frank')
        NST.set('title', 'Frank')
        NST.set('title', 'Frank')

        expect(count).to.eq(5)

    })

});
