import {
    __dir,
    heading,
    assert,
} from '../utils.js'

import fs from 'fs'
import { join } from 'path'

const pjson = JSON.parse( fs.readFileSync(join(__dir, 'package.json'), { encoding: 'utf-8' }))




describe(heading('A | Setup'), function(){
    this.timeout(4_000)

    it('A.1 | Package file contains correct information', async () => {
        assert(typeof pjson === 'object')
        assert(pjson.name === 'nestore')
        assert(pjson.license === 'MIT')
        assert(pjson.type === 'module')
        assert(pjson.main === 'index.js')
        assert(pjson.types === 'dist/nestore.d.ts')

        assert(pjson.person.name === 'Michael Jannetta')
        assert(pjson.person.url === 'https://github.com/pratiqdev')
    });

})
