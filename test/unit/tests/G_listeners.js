import {
    Nestore,
    __dir,
    heading,
    initialStore,
    expect
} from '../utils.js'



describe(heading('G | In Store Listeners'), () => {

    it('G.1 | $title', async () => {
        const NST = new Nestore(initialStore)

        NST.set('title', 'here we go')
        let res = NST.get('value-added-from-$title')
        process.env.DEBUG && console.log('>>', res)
        expect(res).to.eq('This value was set when an in store listener ($title) was triggered by an update to "title"')
    })

})
