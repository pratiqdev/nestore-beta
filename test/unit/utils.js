import assert from 'assert'
import Nestore from '../../index.js'
import mongoAdapter from '../../adapters/mongoAdapter/index.js'
import persistAdapter from '../../adapters/persistAdapter/index.js'
//! dont import here... throws react error
// import useNestore from '../../adapters/useNestore/index.js' 
import chai from 'chai';
import fs from 'fs'
import dotenv from 'dotenv'
import debug from 'debug'

dotenv.config()

const __dir = await fs.promises.realpath('.')
const testStatsFile = __dir + '/test/unit/test-results.json'

chai.config.truncateThreshold = 1500; // disable truncating
const { expect } = chai

const heading = (text) => `${text}\n  ${'-'.repeat(text.length)}`

// const GLOBAL_NST = Nestore({ global: true })

const initialStore = {
    title: 'The Book',
    /** The number of pages in the current book. */
    pages: 817,
    checkedOut: false,
    chapters: ['1-The Start', '2-The Middle', '3-The End'],
    reviews: {
        'someGuy':'This is a book',
        'Some Guy':'This book was... okay.',
        'Big Name':'Best book ever in the world always.',
        'Some Extra':{
            'Stuff Here':{
                find: {
                    'me ?': 'Hello!'
                }
            }
        }
    },

    setterTestA: () => {
        // returns undefined
    },
    setterTestB: () => {
        return true
    },
    setterTestC: (NST, args) => {
        return args
    },
    setterTestD: (NST) => {
        // sets a value
        NST.set('setter-test-d', true)
    },
    setterTestE: (NST, args) => {
        // returns a value from args
        const [thePath] = args
        return NST.get(thePath)
    },
    setterTestF: (NST) => {
        // mutates then returns a value
        let val = NST.get('pages') + 1
        NST.set('pages', val)
        return val
    },
    setterTestG: async (NST) => {
        // console.log('>>> running setter G')
        let prom = () => new Promise(res => setTimeout(() => res(true), 200))
        // console.log('>>> waiting for promise')
        await prom()
        // console.log('>>> setting value')
        NST.set('async', true)
        // console.log('>>> returning value')
        return 'async_success'
    },
    setterTestH: async (NST) => {
        return new Promise((res) => {

            setTimeout(()=>{
                NST.set('async', 77)
                res('7_7')
            }, 200)
        })
    },



    mutabilityTestA: (N, args) => {
        const [newTitle] = args
        N.get().title = newTitle
    },
    mutabilityTestB: (N, args) => {
        const [newTitle] = args
        N.store.title = newTitle
    },

    $title: (N, event) => {
        // console.log(`In store listener event:`, event)
        N.set('value-added-from-$title', 'This value was set when an in store listener ($title) was triggered by an update to "title"')
        // N.set('title', 'new title:' + event.value)
    },
}

const mls = () => {
    /** All data stored as string */
    let store = JSON.stringify({  "mock": "store", "1": "one" });
    let log = debug('nestore:mock-local-storage')

    /** Overwrite the old value with the new string */
    let setItem = (ignoreMockStorageKey, val) => {
        if(typeof val !== 'string'){
            console.log("MOCK_LOCAL_STORAGE >> storage.setItem('string') argument must be string")
        }
        store = val
    }

    /** Get the stored item as a string */
    let getItem = (ignoreMockStorageKey) => {
        return store
    }

    return { getItem, setItem }
}

const mockLocalStorage = mls()



let testResults = {}
try{
    testResults = JSON.parse(await fs.promises.readFile(testStatsFile, { encoding: 'utf-8'}))
}catch(err){
    console.log('Failed to read from "test-results.json" file:', err)
}


export {
    Nestore,
    mongoAdapter,
    persistAdapter,
    mockLocalStorage,
    initialStore,
    __dir,
    testStatsFile,
    heading,
    chai,
    expect,
    assert,
    fs,
    debug,
}