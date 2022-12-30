import {
    nestore,
    createMockStorage,
    heading,
    expect,
} from '../utils.js'


// import nestore from 'nestore'
import createPersistAdapter from '../../index.js'




describe.only(heading('C | Events'), function(){
    this.timeout(30_000)

    it('C.1 | Adapter is registered and emits events', async () => {

        let ns = 'nst-pa-namespace'

        let tempVal = Date.now()

        const NST = await nestore({ time: tempVal }, {
            preventRepeatUpdates: false,
            adapters: [
                createPersistAdapter({
                    namespace: ns,
                    storage: createMockStorage(),
                    storageKey: 'sdfsdf',
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
