import nestore from '../nestore/index.js'
import axios from 'axios'


const NST = nestore({
    num: 0,
    someText: 'here',
    didThing: false,
    /** What */
    asyncComplete: false,


    // only root level key:vals are checked for function type
    // and added to nestore as a method.
    // this value of a function could still be accessed by get()
    //
    // let doNested = get("nested_functions_are_ingored.doNested")
    // let result = doNested(...args)
    // 
    // but the function will have no access to the store
    // so there is no reason to store a nested function here
    nested_functions_are_ignored: {
        doNested: () => {
            console.log('nothing...')
        }
    },


    doThing: (NST, args) => {
        NST.set('didThing', true)
        return 'oyoyoyo'
    },

    doAsyncThing: async (NST, args) => {
        return new Promise((res)=>{
            setTimeout(()=>{
                NST.set('asyncComplete', true)
                res(Date.now() - args[0])
            }, 2_000)
        })
    },

    async3: async (NST) => {

    },


    goFetchData: async (NST, args) => {
        let [idx] = args
        let { data } = await axios.get(`https://jsonplaceholder.typicode.com/todos/${idx}`)
        NST.set('fetchResult', data)
        return 'Got Some Data!'
    },

    neverResolvingPromise: async (NST) => {
        return new Promise((res)=>{
            console.log(`Unresolved : NST:`, NST)
            let i = 0
            setInterval(()=>{
                i++
                NST.set(`unresolvedAt_${i}`, true)
            }, 1000)
        })
    }
}, {
    throwOnRevert: false
})

// NST.on('', (data) => console.log('|> EVENT:', data))

// await new Promise(res => setTimeout(res, 2000))
// console.log('doThing | sync - return "oyoy":', NST.doThing('an argument!'))
// // NST.on('asyncComplete', (data) => console.log('on("asyncComplete") =>', data))







// await new Promise(res => setTimeout(res, 2000))
// let res = await  NST.doAsyncThing(Date.now())
// console.log('doAsyncThing | async - should return time diff:', res)




// await new Promise(res => setTimeout(res, 2000))
// let res2 = await  NST.goFetchData(1)
// console.log('goFetchData | async -  should fetch data:', res2)



// console.log('neverResolvePromise | async - should abandon after time limit')
// await new Promise(res => setTimeout(res, 2000))
// let res3 = await  NST.neverResolvingPromise()
// console.log('...abandon after time limit and returns false:', res3)

// // console.log(NST.get())


// // console.log('... Promise abandoned')



// console.log(NST.get())

// console.log(NST.store.num)
// console.log(NST.set('num', 1))
// console.log(NST.store.num)
// console.log(NST.store.num = 5)
// console.log(NST.store.num)






// console.log(NST.set('someText', 'gone!'))
// console.log(NST.get())



// NST.on('what!', (data) => console.log('WHAT:', data))
// NST.on('ret-num', (data) =>  false)

// NST.emit('what!', 'is this')

// console.log(NST.emit('what!'))
// console.log(NST.emit('what!!!!'))
// console.log(NST.emit('ret-num'))


// console.log('emit:', NST.emit('why', {key: 'why', path: 'why/woul/someone/use/this', value: 'idk'}))