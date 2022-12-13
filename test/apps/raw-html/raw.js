console.log('STATIC HTML NESTORE TEST')
console.log('window.nestore:', window)

const NST = nestore({
    hello: 'World!'
})


NST.on('hello', (data) => {
    console.log('helo:', data.value)
    // document.getElementsByClassName('hello')
})