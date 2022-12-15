import {
    Nestore,
    __dir,
    heading,
    expect,
    assert,
    initialStore
} from '../utils.js'




describe(heading('B | Get'), () => {

    it('B.1 | Get string method returns correct value', () => {
        const NST = new Nestore(initialStore)

        expect(NST.get('title') ).to.eq( initialStore.title)
        expect(NST.get('pages') ).to.eq( initialStore.pages)
        expect(NST.get('checkedOut') ).to.eq( initialStore.checkedOut)
        expect(NST.get('chapters[2]') ).to.eq( initialStore.chapters[2])
        expect(NST.get('reviews.someGuy') ).to.eq( initialStore.reviews.someGuy)
        expect(NST.get('reviews["Some Guy"]') ).to.eq( initialStore.reviews['Some Guy'])
        expect(NST.get('reviews["Some Extra"]["Stuff Here"].find["me ?"]') ).to.eq( initialStore.reviews["Some Extra"]["Stuff Here"].find["me ?"])
    })

    it('B.2 | Get string method returns undefined on incorrect path', () => {
        const NST = new Nestore(initialStore)

        assert(typeof NST.get('frobble') === 'undefined')
        assert(typeof NST.get('pages.frizzle') === 'undefined')
        assert(typeof NST.get('thingy.jimjam') === 'undefined')
    })

    it('B.3 | Get callback method returns correct value', () => {
        const NST = new Nestore(initialStore)

        // assert(get(s => s) === initialStore)
        expect(JSON.stringify(NST.get(s => s))).to.eq(JSON.stringify(initialStore))
        // assert(get(s => s.title) === initialStore.title)

    })

    it('B.4 | Get callback method returns undefined on incorrect path', () => {
        const { get, set, reset, store } = new Nestore(initialStore)

        assert(typeof get(s => s.brapple) === 'undefined')
        assert(typeof get(s => s.fimble.famble) === 'undefined')
        assert(typeof get(s => s.fimble.famble['dongle']) === 'undefined')

    })

    it('B.5 | Get method with no args returns entire store', () => {
        const NST = new Nestore(initialStore)

        // assert(get() === initialStore)
        expect(JSON.stringify(NST.get()))
        .to.eq(JSON.stringify(initialStore))

    })

})
