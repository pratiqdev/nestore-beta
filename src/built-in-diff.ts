import * as _ from 'lodash-es'


const BUILT_IN_DIFF = (a:any,b:any) => {
    var r:any = {};
    _.each(a, function(v:any,k:any) {
        if(b[k] === v) return;
        // but what if it returns an empty object? still attach?
        r[k] = _.isObject(v)
                ? BUILT_IN_DIFF(v, b[k])
                : v
            ;
        });
    return r;
}

export default BUILT_IN_DIFF