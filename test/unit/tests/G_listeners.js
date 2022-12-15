import {
    Nestore,
    __dir,
    heading,
    initialStore
} from '../utils.js'



describe(heading('G | In Store Listeners'), () => {

    it('G.1 | $title', async () => {
        const NST = new Nestore(initialStore)

        NST.set('title', 'here we go')
        let res = NST.get('value-added-from-$title')
        console.log('>>', res)
    })

})
