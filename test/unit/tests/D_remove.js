import {
    Nestore,
    __dir,
    heading,
    expect,
    initialStore
} from '../utils.js'



describe(heading('D | Remove'), () => {

    it('D.1 | Removing values deletes the key:value from the store', () => {
        const NST = new Nestore(initialStore)
        NST.remove('title')
        expect(typeof NST.get('title')).to.eq('undefined')
    })

    it('D.2 | Removing values emits event with undefined value', () => {
        const NST = new Nestore(initialStore)
        let events = null

        NST.on('title', (data) => {
            events = JSON.stringify(data)
        })

        NST.remove('title')
        expect(events).to.eq(JSON.stringify({ path: 'title', key: 'title', value: undefined}))
    })

});
