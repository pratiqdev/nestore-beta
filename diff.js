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