import {
    Nestore,
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
        let persistAdapterFunctions = await persistAdapter(new Nestore())
        expect(persistAdapterFunctions.namespace).to.eq('nestore-persist-adapter')
    })

    it('A.6 | Adapter uses namespace provided', async () => {
        let persistAdapter = createPersistAdapter({
            namespace: '12345',
            storage: createMockStorage(),
            storageKey: 'blappsps',
            batchTime: 500,
        })
        let persistAdapterFunctions = await persistAdapter(new Nestore())
        expect(persistAdapterFunctions.namespace).to.eq('12345')
    })


})

describe.only(heading('B | Adapter'), function(){
    this.timeout(30_000)


    // this.beforeEach(()=>{
    //     mockLocalStorage.clear()
    // })

    it('B.1 | Nestore registers adapter and provides adapter properties by namespace in "NST.adapters"', (done) => {

        let ns = 'nst-pa-namespace'

        let tempVal = Date.now()

        const NST = new Nestore({ time: tempVal }, {
            preventRepeatUpdates: false,
            adapters: [
                createPersistAdapter({
                    namespace: ns,
                    storage: createMockStorage(),
                    storageKey: 'blappsps',
                    batchTime: 500,
                })
            ]
        })

        expect(typeof NST).to.eq('object')
        expect(typeof NST.store).to.eq('object')

        NST.onAny(event => console.log('>> onAny:', event))
        


        //! Nestore will add this adapter to NST.adapters once the adapter generator resolves.
        //! The adapter will emit the 'registered' event just before resolving.
        //! To test NST.adapters you must wait for event "@ready"
        NST.once(`@ready`, () => {
            // does the adapters property exist as an object
            console.log('NST ready. Testing:', NST.adapters)
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
            // expect(typeof NST.adapters[ns].disconnect).to.eq('function')
            // NST.adapters[ns].disconnect()
            console.log('done??')
            done()
        })

    })


    

})

describe(heading('C | Events'), () => {

    it('C.a | Adapter is registered and emits events', (done) => {

        const NST = new Nestore({ name: 'Andrew'}, {
            adapters: [
                createPersistAdapter({
                    mongoUri: process.env.MONGO_URI, 
                    collectionName: 'nestore-adapter-test-collection',
                    documentKey: 'NST_MONGO_TEST_A',
                    batchTime: 500
                })
            ]
        })

        let EMITTED = {
            error: false,
            registered: false,
            loading: false,
            loaded: false,
            saving: false,
            saved: false,
        }

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
            if(events.includes('error')){
                expect.fail('The adapter emitted an error event before calling handleExit()')
            }else if(required.every(req => events.includes(req))){
                console.log('>> All events emitted. Testing...')

                expect(DATA.namespace).to.eq('nestore-persist-adapter')
                // local data should not match data loaded into store
                expect(DATA.preLoadStore).to.not.eq(false)
                expect(DATA.postLoadStore).to.not.eq(false)
                expect(DATA.preSaveStore).to.not.eq(false)
                expect(DATA.postSaveStore).to.not.eq(false)
                expect(DATA.error).to.eq(false)

              
                NST.adapters['nestore-mongo-adapter'].disconnect()
                done()
                done()
            }
        }



        NST.on('@.*.registered', (data) => {
            DATA.namespace = data
            events.push('registered')
            handleExit()
        })
        
        NST.on('@.*.error', (data) => {
            DATA.error = data
            events.push('error')
            handleExit()
        })

        NST.on('@.*.loading', (data) => {
            DATA.preLoadStore = data
            events.push('loading')
            handleExit()
        })

        NST.on('@.*.saving', (data) => {
            DATA.preSaveStore = data
            events.push('saving')
            handleExit()
        })

        NST.on('@.*.saved', (data) => {
            DATA.postSaveStore = data
            events.push('saved')
            handleExit()
        })

        NST.on('@.*.loaded', (data) => {
            DATA.postLoadStore = data
            events.push('loaded')
            handleExit()
            
            setTimeout(()=>{
                NST.set('TRIGGER_MIDDLEWARE_SAVE_EVENT', middlewareSavedValue)
            }, 100)
        })







        
    })

})
