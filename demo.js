var Promise = require('./promise')
/*****************   正常使用   ******************/

var promise = new Promise((resolve) => {
  setTimeout(() => {
    resolve('haha')
  }, 1000)
})
promise
  .then((res) => {
    console.log(res)
    return 123
  })
  .then((res) => {
    console.log(res)
    return 444
  }).then((err) => {
    console.log(err)
  })
console.dir(promise, { depth: 10 })

/*****************   值穿透 demo 1   ******************/

// var promise = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('haha')
//   }, 1000)
// })
// promise
//   .then('hehe')
//   .then(console.log)

/*****************   值穿透 demo 2   ******************/

// var promise = new Promise(function (resolve) {
//   setTimeout(() => {
//     resolve('haha')
//   }, 1000)
// })
// promise.then(() => {
//   promise.then().then((res) => {// ①
//     console.log(res)// haha
//   })
//   promise.catch().then((res) => {// ②
//     console.log(res)// haha
//   })
//   console.log(promise.then() === promise.catch())// true
//   console.log(promise.then(1) === promise.catch({ name: 'nswbmw' }))// true
// })

/*****************   值穿透 demo 3   ******************/

// var promise = new Promise((resolve) => {
//   setTimeout(() => {
//     resolve('haha')
//   }, 1000)
// })
// var a = promise.then()
// a.then((res) => {
//   console.log(res)// haha
// })
// var b = promise.catch()
// b.then((res) => {
//   console.log(res)// haha
// })
// console.log(a === b)// false
