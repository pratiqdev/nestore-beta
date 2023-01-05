import {
    nestore,
    createMockStorage,
    heading,
    expect,
} from '../utils.js'


// import nestore from 'nestore'
import createPersistAdapter from '../../index.js'



describe(heading('A | Generator'), function(){
    this.timeout(10_000)



    it('A.1 | Package provides a function as the default export', () => {
        expect(typeof createPersistAdapter).to.eq('function')
    })

    it('A.2 | Generator throws error when missing or malformed config', () => {

        expect(() => { createPersistAdapter() }).to.throw()
        expect(() => { createPersistAdapter({}) }).to.throw()
        expect(() => { createPersistAdapter(false) }).to.throw()
        expect(() => { createPersistAdapter(true) }).to.throw()
        expect(() => { createPersistAdapter('false') }).to.throw()
        expect(() => { createPersistAdapter('true') }).to.throw()
        expect(() => { createPersistAdapter(55) }).to.throw()
        expect(() => { createPersistAdapter(55.0) }).to.throw()
        expect(() => { createPersistAdapter([]) }).to.throw()
        expect(() => { createPersistAdapter(null) }).to.throw()
        expect(() => { createPersistAdapter(undefined) }).to.throw()
        expect(() => { createPersistAdapter(()=>{}) }).to.throw()

    })
    
    it('A.3 | Generator throws error when missing required: "storageKey"', () => {

        expect(() => { 

            createPersistAdapter({
                namespace: 'nst-persist-adptr',
                storage: createMockStorage(),
                // storageKey: 'blappsps',
                batchTime: 500,
            })
            
        }).to.throw()
    
    })

    it('A.4 | Generator throws error when no storage available or defined', () => {

        expect(() => { 

            createPersistAdapter({
                namespace: 'nst-persist-adptr',
                // storage: createMockStorage(),
                storageKey: 'blappsps',
                batchTime: 500,
            })
            
        }).to.throw()
    
    })

    it('A.4 | Generator returns an adapter function when invoked with correct config', () => {
        expect(typeof createPersistAdapter({
            namespace: 'nst-persist-adptr',
            storage: createMockStorage(),
            storageKey: 'blappsps',
            batchTime: 500,
        })).to.eq('function')
    })

    it('A.5 | Adapter uses default namespace when no namespace provided', async () => {
        let persistAdapter = createPersistAdapter({
            // namespace: 'nst-persist-adptr',
            storage: createMockStorage(),
            storageKey: 'blappsps',
            batchTime: 500,
        })
        let persistAdapterFunctions = await persistAdapter(await nestore())
        expect(persistAdapterFunctions.namespace).to.eq('nestore-persist-adapter')
    })

    it('A.6 | Adapter uses namespace provided', async () => {
        let persistAdapter = createPersistAdapter({
            namespace: '12345',
            storage: createMockStorage(),
            storageKey: 'blappsps',
            batchTime: 500,
        })
        let persistAdapterFunctions = await persistAdapter(await nestore())
        expect(persistAdapterFunctions.namespace).to.eq('12345')
    })


})
