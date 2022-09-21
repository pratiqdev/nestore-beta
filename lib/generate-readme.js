import fs from 'fs'
let __dirname = await fs.promises.realpath('.')
let TEXT = await fs.promises.readFile(__dirname + '/lib/README_SOURCE.md', {encoding: 'utf-8'})


let replace = {
    '{{package_version}}':'1.0.0',
    '{{package_license}}':'MIT',
    '{{package_title}}':'neStore',
    '{{package_name}}':'nestore',
    '{{test_status}}':'passing',
}

Object.entries(replace).forEach(([replaceThis, withThis]) => {
    TEXT = TEXT.replace(new RegExp(replaceThis, 'g'), withThis)
})



await fs.promises.writeFile(__dirname + '/README.md', TEXT)