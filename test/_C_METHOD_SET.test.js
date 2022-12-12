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
  initialStore,
} from './utils.js'

describe(heading('C | Set'), () => {
  it('C.1 | Set method changes existing values', () => {
    const NST = nestore(initialStore)

    NST.set('title', 'The Best Book Ever')
    assert(NST.get('title') === 'The Best Book Ever')
  })

  it('C.2 | Set method assigns new key-values', () => {
    const NST = nestore(initialStore)

    NST.set('brimple', 'boop')
    expect(NST.get('brimple')).to.eq('boop')

    NST.set('dap.bap', 'tap')
    expect(NST.get('dap.bap')).to.eq('tap')
  })

  it('C.3 | Set method should with no args should return false', () => {
    const NST = nestore(initialStore)

    assert(NST.set() === false)
    assert(NST.set('thing') === false)
    assert(NST.set('thing', 'blap') === true)
  })

  // it.skip('C.4 | (set cb is deprecated) Set callback method should set correct values', () => {
  //     const { get, set, reset, store } = nestore(initialStore)

  //     set(s => s.title = '12345')
  //     expect(get('title')).to.eq('12345')

  // })

  it('C.4 | Object passed to set() should override internal store', () => {
    const NST = nestore(initialStore)

    NST.set({
      internalStore: 'override'
    })

    expect(NST.get('internalStore'))
      .to.eq('override')
  })

  it('C.5 | Emits updates for repeated matching events when preventRepeatUpdates = false', () => {
    const NST = nestore(initialStore, {
      preventRepeatUpdates: false
    })
    let count = 0
    NST.on('title', () => count++)

    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')

    expect(count).to.eq(5)
  })

  it('C.6 | Emits no events with "quiet" updates', () => {
    const NST = nestore(initialStore, {
      preventRepeatUpdates: false
    })
    let count = 0
    NST.on('title', () => count++)

    NST.set('title', 'Frank', 'quiet')
    NST.set('title', 'Bob', 'quiet')
    NST.set('title', 'Tom', 'quiet')
    NST.set('title', 'Shawn')

    expect(count).to.eq(1)
  })

  it('C.6 | Emits updates for repeated matching events when preventRepeatUpdates = false', () => {
    const NST = nestore(initialStore, {
      preventRepeatUpdates: false
    })
    let count = 0
    NST.on('title', () => count++)

    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')
    NST.set('title', 'Frank')

    expect(count).to.eq(5)
  })
})
