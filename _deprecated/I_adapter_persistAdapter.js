import {
    Nestore,
    debug,
    persistAdapter,
    mockLocalStorage,
    __dir,
    heading,
    expect,
} from '../utils.js'




describe.only(heading('I | Adapter - persistAdapter'), function(){
    this.timeout(30_000)


    this.beforeEach(()=>{
        mockLocalStorage.clear()
    })

    it('I.1 | Package provides a function as the default export', (done) => {
        expect(typeof persistAdapter).to.eq('function')
        done()
    })

    it('I.2 | Adapter returns a function when invoked', (done) => {
        expect(typeof persistAdapter({
            namespace: 'nst-persist-adptr',
            storage: mockLocalStorage,
            storageKey: 'blappsps',
            batchTime: 500,
        })).to.eq('function')
        done()
    })

    it.only('I.3 | persistAdapter throws error when missing: config', (done) => {
        expect(()=>{
            persistAdapter()
        }).throws()
        done()
    })
    
    it('I.4 | persistAdapter throws error when missing: config.storageKey', (done) => {
    // console.log(nestore)

        const NST = new Nestore({ name: 'Andrew'}, {
            adapters: [
                //@ts-expect-error
                persistAdapter({
                    namespace: 'nst-persist-adptr',
                    storage: mockLocalStorage,
                    // storageKey: 'blappsps',
                    batchTime: 500,
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
                expect(DATA.namespace).to.eq()
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
            }, 100)
        })


    
    })

    it('I.5 | Adapter is registered and emits events', (done) => {

        const NST = new Nestore({ name: 'Andrew'}, {
            adapters: [
                persistAdapter({
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
        let DONE = false

        let handleExit = () => {
            if(events.includes('error')){
                expect.fail('The adapter emitted an error event before calling handleExit()')
            }else if(required.every(req => events.includes(req)) && !DONE){
                DONE = true
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

    


    // it.skip('H.2.1 | Nestore registers adapter - "persistAdapter"', (done) => {

    // const NST = new Nestore({ name: 'Andrew'}, {
    //     adapters: [
    //         persistAdapter({
    //             namespace: 'nst-persist-adptr',
    //             storage: mockLocalStorage,
    //             storageKey: 'blappsps',
    //             batchTime: 500,
    //         })
    //     ]
    // })

    // let EMITTED = {
    //     error: false,
    //     registered: false,
    //     loading: false,
    //     loaded: false,
    //     saving: false,
    //     saved: false,
    // }

    // let DATA = {
    //     namespace: false,
    //     error: false,
    //     preLoadStore: false,
    //     postLoadStore: false,
    //     preSaveStore: false,
    //     postSaveStore: false,
    // }

    // let required = [
    //     'registered',
    //     'loading',
    //     'saving',
    //     'loaded',
    //     'saved',
    // ]
    // let events = []

    // let middlewareSavedValue = Date.now()
    // let DONE = false

    // let handleExit = () => {
    //     if(events.includes('error')){
    //         expect.fail('The adapter emitted an error event before calling handleExit()')
    //     }else if(required.every(req => events.includes(req)) && !DONE){
    //         DONE = true
    //         done()
    //     }
    // }
    // // console.log('registering listeners:', NST)

    // // NST.onAny(data => console.log('any:', data))



    // NST.on('@.*.registered', (data) => {
    //     // console.log('>>> REGISTERED >>>\n', data, '\n\n')
    //     DATA.namespace = data
    //     events.push('registered')
    //     handleExit()
    // })
    
    // NST.on('@.*.error', (data) => {
    //     // console.log('>>> ERROR >>>\n', data, '\n\n')
    //     DATA.error = data
    //     events.push('error')
    //     handleExit()
    // })

    // NST.on('@.*.loading', (data) => {
    //     // console.log('>>> LOADING >>>\n', data, '\n\n')
    //     DATA.preLoadStore = data
    //     events.push('loading')
    //     handleExit()
    // })

    // NST.on('@.*.saving', (data) => {
    //     // console.log('>>> SAVING >>>\n', data, '\n\n')
    //     DATA.preSaveStore = data
    //     events.push('saving')
    //     handleExit()
    // })

    // NST.on('@.*.saved', (data) => {
    //     // console.log('>>> SAVED >>>\n', data, '\n\n')
    //     DATA.postSaveStore = data
    //     events.push('saved')
    //     handleExit()
    // })

    // NST.on('@.*.loaded', (data) => {
    //     // console.log('>>> LOADED >>>\n', data, '\n\n')
    //     DATA.postLoadStore = data
    //     events.push('loaded')
    //     handleExit()
        
    //     setTimeout(()=>{
    //         // console.log('triggering middleware...')
    //         NST.set('TRIGGER_MIDDLEWARE_SAVE_EVENT', middlewareSavedValue)
    //     }, 100)
    // })







    
    // })




})
