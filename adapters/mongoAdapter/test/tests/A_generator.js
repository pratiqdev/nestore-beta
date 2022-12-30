// import nestore from 'nestore'
import {
    nestore,
    heading,
    expect,
    assert,
    initialStore,
} from '../utils.js'

import createMongoAdapter from '../../index.js'




describe(heading('A | Generator '), function(){
    this.timeout(10_000)


    it('A.1 | Package provides a function as the default export', () => {
        expect(typeof createMongoAdapter).to.eq('function')
    })

    it('A.2 | Generator throws error when missing or malformed config', () => {

        expect(() => { createMongoAdapter() }).to.throw()
        expect(() => { createMongoAdapter({}) }).to.throw()
        expect(() => { createMongoAdapter(false) }).to.throw()
        expect(() => { createMongoAdapter(true) }).to.throw()
        expect(() => { createMongoAdapter('false') }).to.throw()
        expect(() => { createMongoAdapter('true') }).to.throw()
        expect(() => { createMongoAdapter(55) }).to.throw()
        expect(() => { createMongoAdapter(55.0) }).to.throw()
        expect(() => { createMongoAdapter([]) }).to.throw()
        expect(() => { createMongoAdapter(null) }).to.throw()
        expect(() => { createMongoAdapter(undefined) }).to.throw()
        expect(() => { createMongoAdapter(()=>{}) }).to.throw()

    })
    
    it('A.3 | Generator throws error when missing required config var: "mongoUri"', () => {

        expect(() => { 

            createMongoAdapter({
                // mongoUri: process.env.MONGO_URI, 
                collectionName: 'nestore-adapter-test-collection',
                documentKey: 'NST_MONGO_TEST_A',
                batchTime: 500
            })
            
        }).to.throw()
    
    })

    it('A.4 | Generator returns an adapter function when invoked with correct config', () => {
        expect(typeof createMongoAdapter({
            mongoUri: process.env.MONGO_URI, 
            collectionName: 'nestore-adapter-test-collection',
            documentKey: 'NST_MONGO_TEST_A',
            batchTime: 500
        })).to.eq('function')
    })

    it('A.5 | Adapter uses default namespace when no namespace provided', async () => {
        let mongoAdapter = createMongoAdapter({
            mongoUri: process.env.MONGO_URI, 
            collectionName: 'nestore-adapter-test-collection',
            documentKey: 'NST_MONGO_TEST_A',
            batchTime: 500,
            // namespace: ns,
        })
        let mongoAdapterFunctions = await mongoAdapter(await nestore())
        expect(mongoAdapterFunctions.namespace).to.eq('nestore-mongo-adapter')
    })

    it('A.6 | Adapter uses namespace provided', async () => {
        let mongoAdapter = createMongoAdapter({
            mongoUri: process.env.MONGO_URI,
            collectionName: 'nestore-adapter-test-collection',
            documentKey: 'NST_MONGO_TEST_A',
            batchTime: 500,
            namespace: '12345',
        })
        let mongoAdapterFunctions = await mongoAdapter(await nestore())
        expect(mongoAdapterFunctions.namespace).to.eq('12345')
    })


})
