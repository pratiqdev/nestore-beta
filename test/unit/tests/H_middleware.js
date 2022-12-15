import {
    Nestore,
    mongoAdapter,
    persistAdapter,
    mockLocalStorage,
    debug,
    __dir,
    heading,
    expect,
} from '../utils.js'



describe(heading('H | Middleware'), function(){
    this.timeout(30_000)

    it('H.1 | Nestore registers adapter - "mongoAdapter"', (done) => {
        // console.log(nestore)
 
        const NST = new Nestore({ name: 'Andrew'}, {
            adapters: [
                mongoAdapter({
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

        let handleExit = () => {
            if(events.includes('error')){
                expect.fail('The adapter threw an error')
            }else if(required.every(req => events.includes(req))){
                done()
            }else{
                // console.log('middleware waiting for all events:', events)
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
                NST.set('TRIGGER_MIDDLEWARE_SAVE_EVENT', 'now')
            },1000)
        })


        
    })

    it('H.1 | Nestore registers adapter - "persistAdapter"', (done) => {
        // console.log(nestore)

        ('creating store...')
        // debug.enable('nestore:**')

        const NST = new Nestore({ name: 'Andrew'}, {
            adapters: [
                persistAdapter({
                    namespace: 'nst-persist-adptr',
                    storage: mockLocalStorage,
                    storageKey: 'blappsps',
                    batchTime: 500,
                })
            ]
        })

        // console.log('Store:', NST.store)

        // expect(NST.store.name).to.eq('Andrew')

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
        let DONE = false

        let handleExit = () => {
            if(events.includes('error')){
                expect.fail('The adapter emitted an error event before calling handleExit()')
            }else if(required.every(req => events.includes(req)) && !DONE){
                DONE = true
                done()
            }
        }
        // console.log('registering listeners:', NST)

        // NST.onAny(data => console.log('any:', data))



        NST.on('@.*.registered', (data) => {
            // console.log('>>> REGISTERED >>>\n', data, '\n\n')
            DATA.namespace = data
            events.push('registered')
            handleExit()
        })
        
        NST.on('@.*.error', (data) => {
            // console.log('>>> ERROR >>>\n', data, '\n\n')
            DATA.error = data
            events.push('error')
            handleExit()
        })

        NST.on('@.*.loading', (data) => {
            // console.log('>>> LOADING >>>\n', data, '\n\n')
            DATA.preLoadStore = data
            events.push('loading')
            handleExit()
        })

        NST.on('@.*.saving', (data) => {
            // console.log('>>> SAVING >>>\n', data, '\n\n')
            DATA.preSaveStore = data
            events.push('saving')
            handleExit()
        })

        NST.on('@.*.saved', (data) => {
            // console.log('>>> SAVED >>>\n', data, '\n\n')
            DATA.postSaveStore = data
            events.push('saved')
            handleExit()
        })

        NST.on('@.*.loaded', (data) => {
            // console.log('>>> LOADED >>>\n', data, '\n\n')
            DATA.postLoadStore = data
            events.push('loaded')
            handleExit()
            
            setTimeout(()=>{
                // console.log('triggering middleware...')
                NST.set('TRIGGER_MIDDLEWARE_SAVE_EVENT', middlewareSavedValue)
            },1000)
        })







        
    })

})
