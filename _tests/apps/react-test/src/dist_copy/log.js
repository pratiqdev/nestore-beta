import createDebug from 'debug'

const l = createDebug('nestore')
const log = {
  constr: l.extend('constructor'),
  set: l.extend('set        '),
  get: l.extend('get        '),
  reset: l.extend('reset      '),
  emit: l.extend('emit       '),
  emitAll: l.extend('emitAll    '),
  norm: l.extend('normPath   '),
  remove: l.extend('remove     '),
  devtool: l.extend('devtool    '),
  call: l.extend('call       ')
}
export default log
