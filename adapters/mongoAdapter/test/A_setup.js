import {
    Nestore,
    mongoAdapter,
    __dir,
    heading,
    expect,
} from '../utils.js'



describe(heading('H | Adapters'), function(){
    this.timeout(30_000)


        it('H.1.1 | Package provides a function as the default export', (done) => {
            expect(typeof mongoAdapter).to.eq('function')
        })

        it('H.1.2 | Adapter returns a function when invoked', (done) => {
            expect(typeof mongoAdapter({
                mongoUri: process.env.MONGO_URI, 
                collectionName: 'nestore-adapter-test-collection',
                documentKey: 'NST_MONGO_TEST_A',
                batchTime: 500
            })).to.eq('function')
        })

        it('H.1.3 | mongoAdapter throws error when missing: config', (done) => {
            expect(()=>{
                const NST = new Nestore({ name: 'Andrew'}, {
                    adapters: [
                        //@ts-expect-error
                        mongoAdapter()
                    ]
                })
            }).throws()
        })
        
        it('H.1.4 | mongoAdapter throws error when missing: config.mongoUri', (done) => {
        // console.log(nestore)

            const NST = new Nestore({ name: 'Andrew'}, {
                adapters: [
                    //@ts-expect-error
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

        it('H.1.5 | Adapter is registered and emits events', (done) => {

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

        


})
