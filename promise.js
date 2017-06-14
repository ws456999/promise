/**
 * @description 简单实现 promise
 *
 *  1. Promise 本质是一个状态机。每个 promise 只能是 3 种状态中的一种：pending、fulfilled 或 rejected。
 *     状态转变只能是 pending -> fulfilled 或者 pending -> rejected。
 *     状态转变不可逆。
 *
 *  2. then 方法可以被同一个 promise 调用多次。
 *
 */

/**
 * var immediate = require('immediate');
 * setTimeout模拟immediate, 当然你可以引入immediate
 *
 * @param {function}
 * @returns function
 */
// var immediate = require('immediate');
var immediate = (fn) => setTimeout(fn, 0)

/**
 * 一个空函数，用来填充new Promise()
 */
function INTERNAL () {}

/**
 * @returns isFunction
 */
function isFunction (fn) {
  return typeof fn === 'function'
}

/**
 * @returns isObject
 */
function isObject (obj) {
  return typeof fn === 'object'
}

/**
 * @returns isArray
 */
function isArray () {
  return Object.prototype.toString.call(arr) === '[object Array]'
}

const PEDDING = 0
const FULFILLED = 1
const REJECTED = 2

/**
 * @class Promise
 */
class Promise {
  constructor (resolver) {
    if (!isFunction(resolver)) {
      throw new TypeError('resolver must be a function')
    }
    this.state = PEDDING
    this.value = void 0
    this.queue = []
    if (resolver !== INTERNAL) {
      // 执行 resolve 或 reject 只会选择执行一个，多次执行无用
      safelyResolveThen(this, resolver)
    }
  }

  /**
   * then方法, promise 从 pending => fulfilled
   *
   * @param {function} [onFulfilled=INTERNAL]
   * @param {function} [onRejected=INTERNAL]
   * @returns
   *
   * @memberof Promise
   */
  then (onFulfilled, onRejected) {
    if (!isFunction(onFulfilled) && this.state === FULFILLED ||
    !isFunction(onRejected) && this.state === REJECTED) {
      return this
    }
    var promise = new this.constructor(INTERNAL)
    if (this.state !== PEDDING) {
      var resolver = this.state === FULFILLED ? onFulfilled : onRejected
      unwrap(promise, resolver, this.value)
    } else {
      this.queue.push(new QueueItem(promise, onFulfilled, onRejected))
    }
    // 每次都抛出一个新的
    return promise
  }

  /**
   * 其实就是.then方法的一个语法糖，看上面就可以了
   *
   * @param {any} onRejected
   * @returns then
   *
   * @memberof Promise
   */
  catch (onRejected) {
    return this.then(null, onRejected)
  }


  /**
   * Promise.resolve 直接抛出一个promise对象 (fulfilled)
   *
   * @static
   * @param {any} value
   * @returns promise
   *
   * @memberof Promise
   */
  static resolve(value) {
    if (value instanceof this) {
      return value;
    }
    return doResolve(new this(INTERNAL), value);
  }


  /**
   * Promise.resolve 直接抛出一个promise对象 (rejected)
   *
   * @static
   * @param {any} reason
   * @returns promise
   *
   * @memberof Promise
   */
  static reject(reason) {
    var promise = new this(INTERNAL);
    return doReject(promise, reason);
  }

}


/**
 * 为 promise 生产执行队列， 简单的说就是promise嵌套
 *
 * @param {promise} promise
 * @param {function} onFulfilled
 * @param {function} onRejected
 */
function QueueItem (promise, onFulfilled, onRejected) {
  this.promise = promise

  this.callFulfilled = function (value) {
    isFunction(onFulfilled) ?
      unwrap(this.promise, onFulfilled, value) :
      doResolve(this.promise, value)
  }

  this.callRejected = function (value) {
    isFunction(onRejected) ?
      unwrap(this.promise, onRejected, value) :
      doReject(this.promise, value)
  }
}

/**
 * 没有错误则执行 doResolve，有错误则执行 doReject
 * called 控制 resolve 或 reject 只执行一次，多次调用没有任何作用
 *
 * @param {promise} self
 * @param {function} then
 */
function safelyResolveThen (self, then) {
  var called = false
  try {
    then((value) => {
      if (called) return
      called = true
      doResolve(self, value)
    }, (err) => {
      if (called) return
      called = true
      doReject(self, err)
    })
  } catch (err) {
    if (called) return
    called = true
    doReject(self, value)
  }
}


/**
 * 执行 promise 的 resolve 或 reject 方法
 *
 * @param {promise} promise
 * @param {function} func
 * @param {any} value
 */
function unwrap (promise, func, value) {
  immediate(() => {
    try {
      returnValue = func(value)
    } catch (err) {
      return doReject(promise, err)
    }
    if (returnValue === promise) {
      doReject(promise, value)
    } else {
      doResolve(promise, returnValue)
    }
  })
}


/**
 * 执行resolve方法
 *
 * @param {promise} self
 * @param {any} value
 * @returns promise
 */
function doResolve (self, value) {
  try {
    // 这个then应该是一个新鲜的promise
    var then = getThen(value)
    if (then) {
      safelyResolveThen(self, then)
    } else {
      self.state = FULFILLED
      self.value = value
      self.queue.forEach(queueItem => {
        queueItem.callFulfilled(value)
      })
    }
    return self
  } catch (err) {
    return doReject(self, err)
  }
}

/**
 * 将当前 promise 标记为REJECTED
 *
 * @param {any} promise
 * @param {any} value
 * @returns
 */
function doReject (self, err) {
  self.state = REJECTED
  self.value = err
  self.queue.forEach(queueItem => {
    queueItem.callRejected(err)
  })
  return self
}


/**
 * 如果obj是个promise的话 返回 promise 的 then方法
 * 否则返回 undefined
 *
 * @param {any} obj
 * @returns function
 */
function getThen (obj) {
  var then = obj && obj.then
  if (obj && (isObject(obj) || isFunction(obj)) && isFunction(then)) {
    return function applyThen() {
      then.apply(obj, arguments)
    }
  }
}

module.exports = Promise
