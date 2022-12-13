import nestore from './dist_copy/index'

const NST = nestore({
  hello: 'world?',
  num: 7,
  inc: (nst) => {
    console.log('increment!')
    nst.set('num', nst.get('num') + 1)
  }
})

export default NST
