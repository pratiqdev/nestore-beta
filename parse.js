import * as _ from 'underscore'

const initialStore = {
    title: 'The Book',
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
    }

}


const keyCount = () => {
    //! This operations execution duration increases proportionally with 
    //! the total number of keys in the store

    //- t1: 1m keys @ 1045 ms

    
    let count = 0
     
    const visitNodes = (obj) => {
        if (typeof obj === 'object') {
          for (let key in obj) {
            visitNodes(obj[key]);
          }
        } else {
            count++
        }
    }

    visitNodes(initialStore)
    return count
}

const quik = (obj) => {
    var count = 0;
    for (var k in obj) if (obj.hasOwnProperty(k)) ++count;
    return count
}

console.log(`keyCount:`, keyCount())
console.log(`Object keys:`, Object.keys(initialStore).length)
console.log(`underscore size:`, _.size(initialStore))
console.log(`underscore keys:`, _.keys(initialStore).length)
console.log(`quik keys:`, quik(initialStore))
