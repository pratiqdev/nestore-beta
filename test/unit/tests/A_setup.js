import {
    nestore,
    __dir,
    heading,
    expect,
    assert,
    initialStore
} from '../utils.js'




describe(heading('A | Setup'), function(){
    this.timeout(4_000)


    it('A.1 | Creates a filled store that returns store and methods', async () => {
        const NST = await nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });
    
    it('A.2 | Creates an empty store that returns store and methods', async () => {
        const NST = await nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });

    it('A.3 | Throws error on incorrect store type', () => {

        // const nst_1 = nestore([])
        //     .then(x => expect(!x))
        //     .catch(e => expect(e))

        // const nst_2 = nestore('')
        //     .then(x => expect(!x))
        //     .catch(e => expect(e))

            let stores = [
                [],
                [1,2,3],
                3,
                '3',
                'a string',
                () => {},
                5 * 'not a number'
            ]
    
            stores.forEach(store => {
                let NST
                expect(() => {
                    NST = nestore(store)
                }).to.throw()
    
            })

    });

    it('A.4 | Throws error on incorrectly formatted config', async () => {
        // const NST = await nestore(initialStore)

        let configs = [
            {
                'what':'is this',
                3: () => {}
            },
            {'':{}},
            {},
            [],
            [1,2,3],
            3,
            '3',
            'a string',
            () => {},
            undefined,
            null,
            5 * 'not a number'
        ]

        configs.forEach( async config => {
            await expect(nestore({}, config))
                .rejects
                .toThrow()

            // expect(NST.settings)
        })
// 
        // await expect(failingAsyncTest())
        // .rejects
        // .toThrow('I should fail');

    });
    
    it('A.5 | Store matches initialStore on start', async () => {
        const NST = await nestore(initialStore)
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    })

    it('A.6 | Mutliple stores do not modify each other', async () => {
        const A = await nestore({ name: 'Alice'})
        const B = await nestore({ name: 'Bob'})

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

    //~ nestore instantiator function does not emit '@ready' if returning another instance of Nestore
    it('A.7 | Passing existing nestore to nestore returns original', async () => {
        const A = await nestore({ name: 'Alice'})
        // done()
        const B = await nestore(A)

        expect(A.get().name).to.eq('Alice')
        expect(B.get().name).to.eq('Alice')
        
        A.set('name', 'Andrew')
        expect(A.get().name).to.eq('Andrew')
        expect(B.get().name).to.eq('Andrew')

        B.set('name', 'Becky')
        expect(A.get().name).to.eq('Becky')
        expect(B.get().name).to.eq('Becky')
        return
    })

    it('A.8 | nestore does not provide access to internal methods', async () => {
        const NST = await nestore({ name: 'Alice'})

        expect(typeof NST.keyCount).to.eq('undefined')
        // expect(typeof NST.#emit).to.eq('undefined')
        // expect(typeof NST.#handleEmitAll).to.eq('undefined')
        // expect(typeof NST.#splitPath).to.eq('undefined')
        // expect(typeof NST.#splitPathToKey).to.eq('undefined')
        
    })


})
