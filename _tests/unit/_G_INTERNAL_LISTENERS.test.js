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

describe(heading('G | Internal listeners'), () => {
  it('G.1 | $title', async () => {
    const NST = nestore(initialStore)

    NST.set('title', 'here we go')
    const res = NST.get('value-added-from-$title')
    console.log('>>', res)
  })
})
