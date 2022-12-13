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


describe(heading('A | Setup'), function () {
  this.timeout(10_000)

  it('A.1 | Creates a filled store that returns store and methods', () => {
    const NST = nestore(initialStore)

    assert(typeof NST.get === 'function')
    assert(typeof NST.set === 'function')
    assert(typeof NST.reset === 'function')
    expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
  })

  it('A.2 | Creates an empty store that returns store and methods', () => {
    const NST = nestore(initialStore)

    assert(typeof NST.get === 'function')
    assert(typeof NST.set === 'function')
    assert(typeof NST.reset === 'function')
    expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
  })

  it('A.3 | Store matches initialStore on start', () => {
    const NST = nestore(initialStore)
    expect(JSON.stringify(NST.get())).to.eq(JSON.stringify(initialStore))
  })

  it('A.4 | Mutliple stores do not modify each other', () => {
    const A = nestore({ name: 'Alice' })
    const B = nestore({ name: 'Bob' })

    expect(A.get('name')).to.eq('Alice')
    expect(B.get().name).to.eq('Bob')
    // assert(A.get().name === 'Alice')
    // assert(B.get().name === 'Bob')

    A.set('name', 'Andrew')
    expect(A.get().name).to.eq('Andrew')
    expect(B.get().name).to.eq('Bob')
    // assert(A.get().name === 'Andrew')
    // assert(B.get().name === 'Bob')

    B.set('name', 'Becky')
    expect(A.get().name).to.eq('Andrew')
    expect(B.get().name).to.eq('Becky')
    // assert(A.get().name === 'Andrew')
    // assert(B.get().name === 'Becky')
  })

  // it('A.5 | (REMOVED) Passing existing nestore to nestore returns original', () => {
  //   const A = nestore({ name: 'Alice' })
  //   const B = nestore(A)

  //   expect(A.get().name).to.eq('Alice')
  //   expect(B.get().name).to.eq('Alice')

  //   A.set('name', 'Bobby')
  //   expect(A.get().name).to.eq('Bobby')
  //   expect(B.get().name).to.eq('Bobby')

  //   B.set('name', 'Charlie')
  //   expect(A.get().name).to.eq('Charlie')
  //   expect(B.get().name).to.eq('Charlie')
  // })

  it('A.6 | Nestore does not provide access to internal methods', () => {
    const NST = nestore({ name: 'Alice' })

    expect(typeof NST.keyCount).to.eq('undefined')
    // expect(typeof NST.#emit).to.eq('undefined')
    // expect(typeof NST.#handleEmitAll).to.eq('undefined')
    // expect(typeof NST.#splitPath).to.eq('undefined')
    // expect(typeof NST.#splitPathToKey).to.eq('undefined')
  })

  it.only('A.7 | Nestore registers adapters', (done) => {
    // console.log(nestore)

    const NST = nestore({ name: 'Andrew' }, {
      adapter: mongoAdapter(
        process.env.MONGO_URI,
        'nestore-adapter-test-collection',
        'NST_MONGO_TEST_A'
      )
      // middleware: [
      // adapters.persist(mockLocalStorage)
      // adapters.mongo(process.env.MONGO_URI)
      // ]
    })

    NST.on('@.*.registered', (data) => console.log('>>> REGISTERED >>>'))
    NST.on('@.*.error', (data) => console.log('>>> ERROR >>>'))
    NST.on('@.*.loading', (data) => console.log('>>> LOADING >>>'))
    NST.on('@.*.loaded', (data) => console.log('>>> LOADED >>>'))
    NST.on('@.*.saving', (data) => console.log('>>> SAVING >>>'))
    NST.on('@.*.saved', (data) => console.log('>>> SAVED >>>'))
    // NST.on('@.*', (data) => console.log('>>> Middleware event (@.*):', data))
    // NST.on('@', (data) => console.log('>>> Middleware event (@):', data))
    // NST.onAny((data) => console.log('>>>tAny event (@):', data))

    setTimeout(() => {
      console.log(NST.get())
    }, 2000)

    setTimeout(() => {
      NST.set('name', 'Bobby')
      NST.set('name', 'Charles')
      // NST.set('name', 'Daniel')
      // NST.set('name', 'Eric')
      // NST.set('name', 'Frank')
      NST.set('age', 1)
      NST.set('age', 2)
      NST.set('age', 3)
      // NST.set('age', 4)
      // NST.set('age', 5)
    }, 3000)

    setTimeout(() => {
      console.log(NST.get())
    }, 5000)

    setTimeout(() => {
      console.log(NST.get())
      console.log('DONE ----------------')
      done()
    }, 9000)
  })
})
