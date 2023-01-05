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

    it('A.2 | Generator throws error when missing or malformed namespace', () => {
        const config = { mongoUri: '1234567890'}
        expect(() => createMongoAdapter('string', config)).to.not.throw()

        expect(() => createMongoAdapter(null, config)).to.throw()
        expect(() => createMongoAdapter({}, config)).to.throw()
        expect(() => createMongoAdapter(false, config)).to.throw()
        expect(() => createMongoAdapter(true, config)).to.throw()
        expect(() => createMongoAdapter('', config)).to.throw() // too short (minLength 4)
        expect(() => createMongoAdapter('-', config)).to.throw() // too short (minLength 4)
        expect(() => createMongoAdapter('--', config)).to.throw() // too short (minLength 4)
        expect(() => createMongoAdapter('---', config)).to.throw() // too short (minLength 4)
        expect(() => createMongoAdapter(55, config)).to.throw()
        expect(() => createMongoAdapter(55.0, config)).to.throw()
        expect(() => createMongoAdapter([], config)).to.throw()
        expect(() => createMongoAdapter(null, config)).to.throw()
        expect(() => createMongoAdapter(undefined, config)).to.throw()
        expect(() => createMongoAdapter(()=>{}, config)).to.throw()

    })

    it('A.3 | Generator throws error when missing or malformed config', () => {
        const namespace = 'my-mongo-adapter-namespace-a3'

        // expect(createMongoAdapter(namespace, { mongoUri: '1234567890'})).to.not.throw()

        expect(() => createMongoAdapter(namespace, {})).to.throw()
        expect(() => createMongoAdapter(namespace, false)).to.throw()
        expect(() => createMongoAdapter(namespace, true)).to.throw()
        expect(() => createMongoAdapter(namespace, 'false')).to.throw()
        expect(() => createMongoAdapter(namespace, 'true')).to.throw()
        expect(() => createMongoAdapter(namespace, 55)).to.throw()
        expect(() => createMongoAdapter(namespace, 55.0)).to.throw()
        expect(() => createMongoAdapter(namespace, [])).to.throw()
        expect(() => createMongoAdapter(namespace, null)).to.throw()
        expect(() => createMongoAdapter(namespace, undefined)).to.throw()
        expect(() => createMongoAdapter(namespace, ()=>{})).to.throw()

    })
    
    it('A.4 | Generator throws error when missing required config var: "mongoUri"', () => {

        expect(() => { 

            createMongoAdapter('mongo-test-namespace-a4', {
                // mongoUri: process.env.MONGO_URI, 
                collectionName: 'nestore-adapter-test-collection',
                documentKey: 'NST_MONGO_TEST_A',
                batchTime: 500
            })
            
        }).to.throw()
    
    })

    it('A.5 | Generator returns an adapter function when invoked with correct config', () => {
        expect(typeof createMongoAdapter('mongo-test-namespace-a5', {
            mongoUri: process.env.MONGO_URI, 
            collectionName: 'nestore-adapter-test-collection',
            documentKey: 'NST_MONGO_TEST_A',
            batchTime: 500
        })).to.eq('function')
    })

    // it('A.6 | Adapter uses default namespace when no namespace provided', async () => {
    //     let mongoAdapter = createMongoAdapter('mongo-test-namespace-a6', {
    //         mongoUri: process.env.MONGO_URI, 
    //         collectionName: 'nestore-adapter-test-collection',
    //         documentKey: 'NST_MONGO_TEST_A',
    //         batchTime: 500,
    //     })
    //     let mongoAdapterFunctions = await mongoAdapter(await nestore())
    //     expect(mongoAdapterFunctions.namespace).to.eq('nestore-mongo-adapter')
    // })

    it('A.6 | Adapter uses namespace provided', async () => {
        const ns = 'mongo-test-namespace-a7'
        let mongoAdapter = createMongoAdapter(ns, {
            mongoUri: process.env.MONGO_URI,
            collectionName: 'nestore-adapter-test-collection',
            documentKey: 'NST_MONGO_TEST_A',
            batchTime: 500,
        })
        let mongoAdapterFunctions = await mongoAdapter(await nestore())
        expect(mongoAdapterFunctions.namespace).to.eq(ns)
    })


})
