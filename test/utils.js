/* eslint-disable */
import assert from 'assert'
import chai from 'chai'
import fs from 'fs'
import dotenv from 'dotenv'
import nestore from '../index.js'

dotenv.config()

const __dir = await fs.promises.realpath('.')
const testResultsFile = `${__dir}/test/test-results.json`

chai.config.truncateThreshold = 1500 // disable truncating
const { expect } = chai

const heading = (text) => `${text}\n  ${'-'.repeat(text.length)}`

const getInitialStore = () => ({
  title: 'The Book',
  /** The number of pages in the current book. */
  pages: 817,
  checkedOut: false,
  chapters: [ '1-The Start', '2-The Middle', '3-The End' ],
  reviews: {
    someGuy: 'This is a book',
    'Some Guy': 'This book was... okay.',
    'Big Name': 'Best book ever in the world always.',
    'Some Extra': {
      'Stuff Here': {
        find: {
          'me ?': 'Hello!'
        }
      }
    }
  },

  setterTestA: () => {
    // returns undefined
  },
  setterTestB: () => true,
  setterTestC: (NST, args) => args,
  setterTestD: (NST) => {
    // sets a value
    NST.set('setter-test-d', true)
  },
  setterTestE: (NST, args) => {
    // returns a value from args
    const [ thePath ] = args
    return NST.get(thePath)
  },
  setterTestF: (NST) => {
    // mutates then returns a value
    const val = NST.get('pages') + 1
    NST.set('pages', val)
    return val
  },
  setterTestG: async (NST) => {
    // console.log('>>> running setter G')
    const prom = () => new Promise((res) => setTimeout(() => res(true), 200))
    // console.log('>>> waiting for promise')
    await prom()
    // console.log('>>> setting value')
    NST.set('async', true)
    // console.log('>>> returning value')
    return 'async_success'
  },
  setterTestH: async (NST) => new Promise((res) => {
    setTimeout(() => {
      NST.set('async', 77)
      res('7_7')
    }, 200)
  }),

  mutabilityTestA: (N, args) => {
    const [ newTitle ] = args
    N.get().title = newTitle
  },
  mutabilityTestB: (N, args) => {
    const [ newTitle ] = args
    N.store.title = newTitle
  },

  $title: (N, event) => {
    console.log('In store listener event:', event)
    N.set('value-added-from-$title', 'ayooo')
    // N.set('title', 'new title:' + event.value)
  }
})

const getMockLocalStorage = () => {
  let store = JSON.stringify({ thisValue: 'is from mockLocalStorage - a mock localStorage setup' })
  const set = (val) => store = JSON.stringify(val)
  const get = () => JSON.parse(store)

  return { get, set }
}


const getTestResults = async () => JSON.parse(await fs.promises.readFile(testResultsFile, { encoding: 'utf-8' }))


export {
    nestore,
    __dir,
    assert,
    expect,
    testResultsFile,

    getTestResults,
    heading,
    getMockLocalStorage,
    getInitialStore,
}