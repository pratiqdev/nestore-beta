// import nestore from 'nestore'
import {
    Nestore,
    heading,
    expect,
    assert,
    initialStore,
} from '../utils.js'

import createMongoAdapter from '../../index.js'




describe(heading('A | createMongoAdapter'), function(){
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
        let mongoAdapterFunctions = await mongoAdapter(new Nestore())
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
        let mongoAdapterFunctions = await mongoAdapter(new Nestore())
        expect(mongoAdapterFunctions.namespace).to.eq('12345')
    })


})


describe(heading('B | mongoAdapter'), function(){
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

    it('B.1 | Nestore registers adapter and provides adapter properties by namespace in "NST.adapters"', (done) => {

        let ns = 'john_jingleheimer'

        const NST = new Nestore({ time: Date.now() }, {
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


        NST.on(`@ready`, async () => {
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
            done()
        })

    })


})



describe.only(heading('C | mongoAdapter'), function(){
    let timeout = 30_000
    this.timeout(timeout)

    this.beforeEach(()=> {
        // (nst ||process).removeAllListeners()
    })


    it('C.1 | Adapter is registered and emits events', function(done){
        console.log('starting C.1')


        const NST = new Nestore({ time: Date.now() }, {
            preventRepeatUpdates: false,
            adapters: [
                createMongoAdapter({
                    mongoUri: process.env.MONGO_URI, 
                    collectionName: 'nestore-adapter-test-collection',
                    documentKey: 'NST_MONGO_TEST_B',
                    batchTime: 500
                })
            ]
        })

        let DATA = {
            namespace: false,
            error: false,
            preLoadStore: false,
            postLoadStore: false,
            preSaveStore: false,
            postSaveStore: false,
        }

        let required = [
            'registered',
            'loading',
            'saving',
            'loaded',
            'saved',
        ]
        let events = []

        let middlewareSavedValue = Date.now()

        let handleExit = () => {
            if(required.every(req => events.includes(req))){
                // done()
                console.log('>> All events emitted. Testing...')

                expect(DATA.namespace).to.eq('nestore-mongo-adapter')
                // local data should not match data loaded into store
                expect(DATA.preLoadStore).to.not.eq(false)
                expect(DATA.postLoadStore).to.not.eq(false)
                expect(DATA.preSaveStore).to.not.eq(false)
                expect(DATA.postSaveStore).to.not.eq(false)
                expect(DATA.error).to.eq(false)

              
                NST.adapters['nestore-mongo-adapter'].disconnect()
                done()
            }
        }




        NST.on('@.*.registered', (data) => {
            console.log('>> registered')
            DATA.namespace = data
            events.push('registered')
            handleExit()
        })
        
        NST.on('@.*.error', (data) => {
            console.log('>> error', data)
            // DATA.error = data
            // events.push('error')
            // handleExit()
            done(data)
        })
        
        NST.on('@.*.loading', (data) => {
            console.log('>> loading')
            DATA.preLoadStore = data
            events.push('loading')
            handleExit()
        })
        
        NST.on('@.*.saving', (data) => {
            console.log('>> saving')
            DATA.preSaveStore = data
            events.push('saving')
            handleExit()
        })

        NST.on('@.*.saved', (data) => {
            console.log('>> saved')
            DATA.postSaveStore = data
            events.push('saved')
            handleExit()
        })
        
        NST.on('@.*.loaded', (data) => {
            console.log('>> loaded')
            DATA.postLoadStore = data
            events.push('loaded')
            handleExit()
            
            setTimeout(()=>{
                NST.set('TRIGGER_MIDDLEWARE_SAVE_EVENT', middlewareSavedValue)
            }, 100)
        })







        
    })

})
