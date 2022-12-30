import {
    nestore,
    createMockStorage,
    heading,
    expect,
} from '../utils.js'


// import nestore from 'nestore'
import createPersistAdapter from '../../index.js'



describe(heading('B | Adapter'), function(){
    this.timeout(30_000)


    // this.beforeEach(()=>{
    //     mockLocalStorage.clear()
    // })

    it('B.1 | Nestore registers adapter and provides adapter properties by namespace in "NST.adapters"', async () => {

        let ns = 'nst-pa-namespace'

        let tempVal = Date.now()

        const NST = await nestore({ time: tempVal }, {
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
        // done()

    })


    

})
