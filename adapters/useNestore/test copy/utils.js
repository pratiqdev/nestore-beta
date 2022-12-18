import assert from 'assert'
import Nestore from '../../../index.js'

//! dont import here... throws react error
// import useNestore from '../../adapters/useNestore/index.js' 
import chai from 'chai';
import fs from 'fs'
import dotenv from 'dotenv'
import debug from 'debug'
import Conf from 'conf';

dotenv.config()

const createMockStorage = () => {
    let CONF = new Conf({
        store: {
            mockStorage: 'npm-conf'
        }
    })

    const getItem = (key) => {
        return JSON.stringify(CONF.get('store', {}))
    }

    const setItem = (key, val) => {
        if(val && typeof val !== 'string'){
            console.log('mockStorage.setTime(<string>) only accepts type string')
            return
        }
        return CONF.set('store', val ?? {})
    }

    return {
        getItem,
        setItem,
    }
}


// const __dir = await fs.promises.realpath('.')
// const testStatsFile = __dir + '/test/unit/test-results.json'

chai.config.truncateThreshold = 1500; // disable truncating
const { expect } = chai


const COLORS = {
    reset: '\x1b[0m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    blackBg: '\x1b[40m',
    redBg: '\x1b[41m',
    greenBg: '\x1b[42m',
    yellowBg: '\x1b[43m',
    blueBg: '\x1b[44m',
    magentaBg: '\x1b[45m',
    cyanBg: '\x1b[46m',
    whiteBg: '\x1b[47m'
}

const heading = (text, color) => `${color ? COLORS[color] : COLORS.blue}${text}\n  ${'-'.repeat(80)}${COLORS.reset}`



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
        process.env.DEBUG && console.log(`In store listener event ($title):`, event)
        N.set(
            'value-added-from-$title',
            'This value was set when an in store listener ($title) was triggered by an update to "title"'
        )
    },
}


// let testResults = {}
// try{
//     testResults = JSON.parse(await fs.promises.readFile(testStatsFile, { encoding: 'utf-8'}))
// }catch(err){
//     console.log('Failed to read from "test-results.json" file:', err)
// }

// import React from 'react'
// import {render} from '@testing-library/react'
// // import {ThemeProvider} from 'my-ui-lib'
// // import {TranslationProvider} from 'my-i18n-lib'
// // import defaultStrings from 'i18n/en-x-default'

// const AllTheProviders = ({children}) => {
//   return (
//     <>
//     {/* <ThemeProvider theme="light"> */}
//        {/* <TranslationProvider messages={defaultStrings}> */}
//         {children}
//       {/* </TranslationProvider> */}
//     {/* </ThemeProvider> */}
//     </>
//   )
// }

// const customRender = (ui, options) =>
//   render(ui, {wrapper: AllTheProviders, ...options})

// // re-export everything
// export * from '@testing-library/react'

// // override render method


export {
    Nestore,
    // customRender as render,

    initialStore,
    createMockStorage,
    heading,
    chai,
    expect,
    assert,
    debug,
}