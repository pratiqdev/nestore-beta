// import nestore from 'nestore'
import {
    nestore,
    heading,
    expect,
    assert,
    initialStore,
} from '../utils.js'

import createMongoAdapter from '../../index.js'







describe.only(heading('B | Registration'), function(){
    this.timeout(60_000)

    // this.beforeEach(()=> {
    //     process.removeAllListeners()
    // })


    // it('A.7 | Adapter returns "namespace", "load" and "save" properties', async () => {
    //     let ns = 'john_jingleheimer'
        
    //     let mongoAdapter = createMongoAdapter({
    //         mongoUri: process.env.MONGO_URI,
    //         collectionName: 'nestore-adapter-test-collection',
    //         documentKey: 'NST_MONGO_TEST_A',
    //         batchTime: 500,
    //         namespace: ns,
    //     })

    //     let mongoAdapterFunctions = await mongoAdapter(new Nestore())

    //     console.log('adapter functions:', mongoAdapterFunctions)
        
    //     expect(typeof mongoAdapterFunctions).to.eq('object')
    //     expect(typeof mongoAdapterFunctions.namespace).to.eq('string')
    //     expect(typeof mongoAdapterFunctions.load).to.eq('function')
    //     expect(typeof mongoAdapterFunctions.save).to.eq('function')
        
    //     expect(mongoAdapterFunctions.namespace).to.eq(ns)
    // })

    it('B.1 | Nestore registers adapter and provides adapter properties by namespace in "NST.adapters"', async () => {

        let ns = 'john_jingleheimer'

        const NST = await nestore({ time: Date.now() }, {
            adapters: [
                createMongoAdapter({
                    mongoUri: process.env.MONGO_URI, 
                    collectionName: 'nestore-adapter-test-collection',
                    documentKey: 'NST_MONGO_TEST_A',
                    batchTime: 500,
                    namespace: ns
                })
            ]
        })

        // NST.onAny(event => console.log('>> onAny:', event))


        // does the adapters property exist as an object
        expect(typeof NST.adapters).to.eq('object')

        // did the single adapter get registered
        expect(Object.keys(NST.adapters).length).to.gte(1)
        
        // does the registered adapter have the correct namespace-key
        // the key at index 0 shoud be === namespace
        expect(Object.keys(NST.adapters)[0]).to.eq(ns)

        // the value at NST.adapters[namespace] should be an object with load, save, namespace
        expect(typeof NST.adapters[ns]).to.eq('object')
        expect(typeof NST.adapters[ns].namespace).to.eq('string')
        expect(typeof NST.adapters[ns].load).to.eq('function')
        expect(typeof NST.adapters[ns].save).to.eq('function')
        expect(typeof NST.adapters[ns].disconnect).to.eq('function')
        NST.adapters[ns].disconnect()
        // done()

    })


})
