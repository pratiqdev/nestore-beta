import {
    Nestore,
    __dir,
    heading,
    expect,
    assert,
    initialStore
} from '../utils.js'




describe(heading('A | Setup'), function(){
    this.timeout(10_000)

    it('A.1 | Creates a filled store that returns store and methods', () => {
        const NST = new Nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });
    
    it('A.2 | Creates an empty store that returns store and methods', () => {
        const NST = new Nestore(initialStore)

        assert(typeof NST.get === 'function')
        assert(typeof NST.set === 'function')
        assert(typeof NST.reset === 'function')
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    });

    it('A.3 | Throws error on incorrect store type', () => {
        expect(() => {
            new Nestore([])
        }).to.throw()

        expect(() => {
            new Nestore({})
        }).to.not.throw()
    });

    it('A.4 | Rejects or ignores incorrectly formatted config', () => {
        const NST = new Nestore(initialStore)

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

        configs.forEach(config => {
            let NST
            expect(() => {
                NST = new Nestore({}, config)
            }).to.not.throw()

            expect(NST.settings)
        })

    });
    
    it('A.5 | Store matches initialStore on start', () => {
        const NST = new Nestore(initialStore)
        expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
    })

    it('A.6 | Mutliple stores do not modify each other', () => {
        const A = new Nestore({ name: 'Alice'})
        const B = new Nestore({ name: 'Bob'})

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

    it('A.7 | Passing existing nestore to nestore returns original', () => {
        const A = new Nestore({ name: 'Alice'})
        const B = new Nestore(A)

        expect(A.get().name).to.eq('Alice')
        expect(B.get().name).to.eq('Alice')
        
        A.set('name', 'Andrew')
        expect(A.get().name).to.eq('Andrew')
        expect(B.get().name).to.eq('Andrew')

        B.set('name', 'Becky')
        expect(A.get().name).to.eq('Becky')
        expect(B.get().name).to.eq('Becky')
        
    })

    it('A.8 | Nestore does not provide access to internal methods', () => {
        const NST = new Nestore({ name: 'Alice'})

        expect(typeof NST.keyCount).to.eq('undefined')
        // expect(typeof NST.#emit).to.eq('undefined')
        // expect(typeof NST.#handleEmitAll).to.eq('undefined')
        // expect(typeof NST.#splitPath).to.eq('undefined')
        // expect(typeof NST.#splitPathToKey).to.eq('undefined')
        
    })


})
