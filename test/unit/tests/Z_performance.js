import {
    nestore,
    __dir,
    testStatsFile,
    heading,
    expect,
    assert,
    fs,
} from '../utils.js'


describe(heading('Performance'), function(){
    if(!process.env.PERF) return;
    this.timeout(60_000)

    after(function(){
        fs.promises.writeFile(testStatsFile, JSON.stringify(testResults, null, 2))
        console.log('\tPerformance tests complete.')
        console.log('\tWrote result data to stat file: "test-results.json"')
    })

    beforeEach(function(){
        console.log('')
    })

    let defaultMap = new Map()

    let OPERATION_LIMIT = 10_000
    let CYCLE_LIMIT = 100
    let MAX_AVG_OP_TIME = 0.02
    let MAX_STAT_HISTORY = 5
    let enableLogging = false


    let set = 'ABCDEF'
    const average = array => array.reduce((a, b) => a + b) / array.length;
    const min = array => Math.min(...array)
    const max = array => Math.max(...array)
    let randStr = (val = 8) => {
        let str = ''
        while(str.length < val){
            str += set[Math.floor(Math.random() * set.length)]
        }
        return str
    }
    
    let smallNum = (num) => {
        num += ''
        let l = num.length
        if(l > 3 && l <= 6) return num.substring(0,l-3) + ' K'
        else if(l > 6 && l <= 9) return num.substring(0,l-6) +'.'+ num.substring(l-6,l-4) + ' M'
        else if(l > 9 && l <= 12) return num.substring(0,l-9) +'.'+ num.substring(l-9,l-7) + ' B'
        else if(l > 12 && l <= 15) return num.substring(0,l-12) +'.'+ num.substring(l-12,l-10) + ' T'
        else return num
    }

    const handleOutput = (test, opTime, startTime, durationArr, done) => {
        if(!testResults[test]){
            testResults[test] = []
        }
        
        testResults[test].push(opTime)
        if(testResults[test].length > MAX_STAT_HISTORY + 1){
            testResults[test].shift()
        }
        
        if(!enableLogging) return done()

        console.log(`\n\t`+'.'.repeat(50))
        // console.log(`\tTotal cycles               : ${CYCLE_LIMIT}`)
        console.log(`\tTotal test duration        : ${Date.now() - startTime} ms`)
        // console.log(`\tTotal operations           : ${smallNum(CYCLE_LIMIT * OPERATION_LIMIT)}`)
        console.log(`\tAverage time per operation : ${opTime + ''.substring(0,6)} ms`)
        // console.log(`\tDurations at start / end   : ${durationArr[0]} / ${durationArr[durationArr.length - 1]} `)
        // console.log(`\tDifference start / end     : ${((durationArr[durationArr.length - 1] - durationArr[0]) + '').substring(0,6)} ms`)
        console.log(`\tAverage cycle duration     : ${average(durationArr)} ms`)
        // console.log(`\tMaximum cycle duration     : ${max(durationArr)} ms`)
        // console.log(`\tMinimum cycle duration     : ${min(durationArr)} ms`)

        
        let thisStats = testResults[test]

        if(thisStats.length < MAX_STAT_HISTORY){
            console.log('\tNot enough historical data to graph...')
            console.log('\t'+'.'.repeat(50) + '\n')
            return done()
        }

        let _max = Math.max(...thisStats)
        let _min = Math.min(...thisStats)

        let stepSize = (_max - _min) / 10

        // console.log(`\tMax historical score: `, (_max + '').substring(0,5) )
        // console.log(`\tMin historical score: `, (_min + '').substring(0,5) )
        console.log(`\tLast score:`, thisStats[thisStats.length - 1])
        
        // console.log('\t'+'.'.repeat(50) + '\n')
        console.log('')



        let i = 0

        while(i < thisStats.length - 1){
            let str = '\t'
            i++

            let diff = thisStats[i] - thisStats[i - 1]
            diff = diff > 0 ? '+' : '-'

            str += `${diff} | `
            str += `${(thisStats[i] + '').substring(0,7)}  |`
            str += `||`.repeat( ((thisStats[i] - _min) / stepSize) + 1 )
            
            console.log(str)
        }
        console.log('\t'+'.'.repeat(50) + '\n')

        done()

    }

    // console.log(`\tOperation limit: ${OPERATION_LIMIT * CYCLE_LIMIT}`)

    it('PERF.0 | init', async (done) => {
        console.log('\tPERF.0 | init')
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []

        
        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0
            
            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                const NST = await nestore()
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)
   
        handleOutput('PERF.1', avgOpTime, TEST_START, durationArr, done)
        
    })
    
    it('PERF.1 | set', async (done) => {
        console.log('\tPERF.1 | set')
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []

        const NST = await nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)
                NST.set(key, val)
                // assert(NST.get(key) === val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)
   
        handleOutput('PERF.1', avgOpTime, TEST_START, durationArr, done)
        
    })

    it('PERF.2 | get', async (done) => {
        console.log('\tPERF.2 | get')

        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = await nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)
                NST.get(key)
                // assert(NST.get(key) === val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)

            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.2', avgOpTime, TEST_START, durationArr, done)

    })

    it('PERF.3 | get random', async (done) => {
        console.log('\tPERF.3 | get random')
        
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = await nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                let res = NST.get(key)
                assert(res === val || res === undefined)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)

            // enableLogging && console.log(`\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.3', avgOpTime, TEST_START, durationArr, done)


    })

    it('PERF.4 | set => get', async (done) => {
        console.log('\tPERF.4 | set => get')
        
        // let OPERATION_LIMIT = 100
        // let CYCLE_LIMIT = 10
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        const NST = await nestore()

        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                NST.set(key, val)
                // let g = '1'
                NST.get(key)
                // expect(g).to.eq(val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.4', avgOpTime, TEST_START, durationArr, done)

        
        
        

    })

    it('PERF.5 | default Map comparison : set => get', (done) => {
        console.log('\tPERF.5 | default map comparison : set => get')
        
        // let OPERATION_LIMIT = 1
        // let CYCLE_LIMIT = 10
        let NUM_OF_OPERATIONS = 0
        let NUM_OF_CYCLES = 0
        let TEST_START = Date.now()
        let durationArr = []
        
        while(NUM_OF_CYCLES < CYCLE_LIMIT){
            const CYCLE_START = Date.now()
            NUM_OF_CYCLES++
            NUM_OF_OPERATIONS = 0

            while(NUM_OF_OPERATIONS < OPERATION_LIMIT){
                NUM_OF_OPERATIONS++
                let key = randStr()
                let val = 'value-' + key
                // console.log('set and get:', NUM_OF_OPERATIONS * NUM_OF_CYCLES)

                // let g = '1'
                defaultMap.set(key, val)
                expect(defaultMap.get(key)).to.eq(val)
            }
            let dur = Date.now() - CYCLE_START
            durationArr.push(dur)

            
            process.stdout.write("\r\x1b[K" +  `\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)


            // enableLogging && console.log(`\tCycle ${NUM_OF_CYCLES} / ${CYCLE_LIMIT} : ${smallNum(NUM_OF_CYCLES * NUM_OF_OPERATIONS)} : ${dur} ms : ${((dur / OPERATION_LIMIT)+'').substring(0,6)} ms avg`)
            
        }
        
        const avgOpTime = average(durationArr) / OPERATION_LIMIT

        expect(avgOpTime).to.be.lessThanOrEqual(MAX_AVG_OP_TIME)

        handleOutput('PERF.5', avgOpTime, TEST_START, durationArr, done)

    })



  


    // it('PERF STATS - output', async ()=>{
    //     fs.promises.writeFile(testStatsFile, JSON.stringify(testResults, null, 2))
    //     console.log('Wrote to stat file...')
    // })
    
});