import _ from 'underscore'

function diff(a,b) {
    var r = {};
    _.each(a, function(v,k) {
        if(b[k] === v) return;
        // but what if it returns an empty object? still attach?
        r[k] = _.isObject(v)
                ? diff(v, b[k])
                : v
            ;
        });
    return r;
}

const A = {
    name: 'John',
    age: 40,
    hobby: 'Games'
}

const B = {
    name: 'Johnny',
    age: 40,
    hobby: 'Games'
}

const C = {
    name: 'John',
    age: 41,
    hobby: 'Games'
}

const D = {
    name: 'John',
    age: 41,
    hobby: 'Gaming'
}

//                    NEW, OLD
console.log('A-B',diff(B,A))


    //_ This method of updating the store is not recommended                
            //_ diffing is flawed and does not promote use of wildcard listeners    
            //_ Also not setting any values on the store...
            //_ set(s => s.title = 'value')
            // if(typeof path === 'function'){
            //     let tempStore = _.cloneDeep(this.INTERNAL_STORE)
            //     path(tempStore)
            //     let changeMap = this.DIFF_FUNC(this.INTERNAL_STORE, tempStore)
            //     Object.entries(changeMap).forEach(([k,v]:any) => {
            //         console.log(`changeMap: "${k}" => "${v}"`)
            //         this.#emit(k, {
            //             path: '',
            //             key: k,
            //             value: v
            //         })
            //     })
            //     return
            // }
            //_                                                                      
            
