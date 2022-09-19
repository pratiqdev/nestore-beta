import debug from 'debug'
const l = debug('nestore')

const log = {
    constr: l.extend('constructor'),
    set:    l.extend('set        '),
    get:    l.extend('get        '),
    reset:  l.extend('reset      '),
    emit:   l.extend('emit       '),
    emitAll:l.extend('emitAll    '),
}

export default log