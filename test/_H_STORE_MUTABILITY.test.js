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

//- Store Mutability
//- The store should not be mutable externally, without using the `set` method.
//- Should create a separate public method for quiet updates 
//- like Steve Rulz "secretly" or zustands "transient updates"

describe(heading('H | Store Mutability'), () => {
  it('H.1 | NST.get() => store.* = X', async () => {
    const NST = nestore(initialStore)

    const recievedEvents = []
    NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

    NST.store.title = 'aaa'
    expect(NST.get('title')).to.not.eq('aaa')

    // no events should be emitted from direct mutations, if they happen
    expect(recievedEvents.length).to.eq(0)
  })

  it('H.2 | NST.store.* = X', async () => {
    const NST = nestore(initialStore)

    const recievedEvents = []
    NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

    NST.store.title = 'bbb'
    expect(NST.get('title')).to.not.eq('bbb')

    // no events should be emitted from direct mutations, if they happen
    expect(recievedEvents.length).to.eq(0)
  })

  it('H.3 | setter((x) => x.get() => .store.* = X)', async () => {
    const NST = nestore(initialStore)

    const recievedEvents = []
    NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

    NST.mutabilityTestA('ccc')
    expect(NST.get('title')).to.not.eq('ccc')

    // no events should be emitted from direct mutations, if they happen
    expect(recievedEvents.length).to.eq(0)
  })

  it('H.4 | setter((x) => x.store.* = X)', async () => {
    const NST = nestore(initialStore)

    const recievedEvents = []
    NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

    NST.mutabilityTestB('ddd')
    expect(NST.get('title')).to.not.eq('ddd')

    // no events should be emitted from direct mutations, if they happen
    expect(recievedEvents.length).to.eq(0)
  })

  it('H.5 | NST.get("path") = X', async () => {
    const NST = nestore(initialStore)

    const recievedEvents = []
    NST.on('', (data) => recievedEvents.push(JSON.stringify(data)))

    NST.store.title = 'eee'
    expect(NST.get('title')).to.not.eq('eee')

    // no events should be emitted from direct mutations, if they happen
    expect(recievedEvents.length).to.eq(0)
  })
})