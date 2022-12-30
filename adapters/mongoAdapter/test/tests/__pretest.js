// import nestore from 'nestore'
import {
    nestore,
    heading,
    expect,
    assert,
    initialStore,
} from '../utils.js'



describe(heading('PRETEST | createMongoAdapter'), function(){
    this.timeout(10_000)

    it('Has access to correct environment variables for testing', () => {
        expect(typeof process.env).to.eq('object')
        expect(typeof process.env.MONGO_URI).to.eq('string')
        expect(process.env.MONGO_URI.length).to.be.gte('10')
    })

})
