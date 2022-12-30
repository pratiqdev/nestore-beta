// import nestore from 'nestore'
import {
    nestore,
    heading,
    expect,
    assert,
    initialStore,
} from '../utils.js'

import createMongoAdapter from '../../index.js'






describe(heading('C | Events'), function(){
    let timeout = 30_000
    this.timeout(timeout)

    this.beforeEach(()=> {
        // (nst ||process).removeAllListeners()
    })


    it('C.1 | Adapter is registered and emits events', async function(done){
        console.log('starting C.1')


        const NST = await nestore({ time: Date.now() }, {
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
