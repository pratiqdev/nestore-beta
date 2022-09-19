let smallNum = (num) => {
    num += ''
    let l = num.length
    if(l > 3 && l <= 6) return num.substring(0,l-3) + ' K'
    else if(l > 6 && l <= 9) return num.substring(0,l-6) + ' M'
    else if(l > 9 && l <= 12) return num.substring(0,l-9) + ' B'
    else if(l > 12 && l <= 15) return num.substring(0,l-12) + ' T'
    else return num
}

console.log(smallNum(1))
console.log(smallNum(10))
console.log(smallNum(100))
console.log(smallNum(100_0))
console.log(smallNum(100_00))
console.log(smallNum(100_000))
console.log(smallNum(100_000_0))
console.log(smallNum(100_000_00))
console.log(smallNum(100_000_000))
console.log(smallNum(100_000_000_0))
console.log(smallNum(100_000_000_00))
console.log(smallNum(100_000_000_000))