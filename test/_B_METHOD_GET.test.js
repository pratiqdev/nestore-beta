/* eslint-disable */
import {
  nestore,
  __dir,
  assert,
  expect,
  testResultsFile,

  getTestResults,
  heading,
  getMockLocalStorage,
  getInitialStore,
} from './utils.js'

describe(heading('B | Get'), () => {
  it('B.1 | Get string method returns correct value', () => {
    const NST = nestore(getInitialStore())

    expect(NST.get('title')).to.eq(getInitialStore().title)
    expect(NST.get('pages')).to.eq(getInitialStore().pages)
    expect(NST.get('checkedOut')).to.eq(getInitialStore().checkedOut)
    expect(NST.get('chapters[2]')).to.eq(getInitialStore().chapters[2])
    expect(NST.get('reviews.someGuy')).to.eq(getInitialStore().reviews.someGuy)
    expect(NST.get('reviews["Some Guy"]')).to.eq(getInitialStore().reviews['Some Guy'])
    expect(NST.get('reviews["Some Extra"]["Stuff Here"].find["me ?"]')).to.eq(getInitialStore().reviews['Some Extra']['Stuff Here'].find['me ?'])
  })

  it('B.2 | Get string method returns undefined on incorrect path', () => {
    const NST = nestore(getInitialStore())

    assert(typeof NST.get('frobble') === 'undefined')
    assert(typeof NST.get('pages.frizzle') === 'undefined')
    assert(typeof NST.get('thingy.jimjam') === 'undefined')
  })

  it('B.3 | Get callback method returns correct value', () => {
    const NST = nestore(getInitialStore())

    // assert(get(s => s) === getInitialStore())
    expect(JSON.stringify(NST.get((s) => s))).to.eq(JSON.stringify(getInitialStore()))
    // assert(get(s => s.title) === getInitialStore().title)
  })

  it('B.4 | Get callback method returns undefined on incorrect path', () => {
    const { get, set, reset, store } = nestore(getInitialStore())

    assert(typeof get((s) => s.brapple) === 'undefined')
    assert(typeof get((s) => s.fimble.famble) === 'undefined')
    assert(typeof get((s) => s.fimble.famble.dongle) === 'undefined')
  })

  it('B.5 | Get method with no args returns entire store', () => {
    const NST = nestore(getInitialStore())

    // assert(get() === getInitialStore())
    expect(JSON.stringify(NST.get()))
      .to.eq(JSON.stringify(getInitialStore()))
  })
})
