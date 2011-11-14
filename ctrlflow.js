
var curry = require('curry')
  , d = require('d-utils')
  , parallel = {}
  , serial = {}

exports = module.exports = seq
exports.seq = seq
exports.parallel = parallel 
exports.serial = serial

function findErr (funx){
  for(var i in funx){
    if(funx[i].arguments[0])
      return funx[i].arguments[0]
  }
}

var group = exports.group = function (groups, done) {

  var funx = function () {
    var args = [].slice.call(arguments)
      , cb = args.pop()
      , isDone = false
      , started = 0, finished = 0, ready = false, results = {}, error

    function checkDone () {
      if(error || (ready && started == finished) && !isDone)
        isDone = true, cb(error, results)
    }

    d.each(groups, function (steps, name) {
      var _args = args.slice(), n = 0
      _args.push(function () {

        if(!n++) {
          var args = [].slice.call(arguments)
          finished ++
          results[name] = args.slice(1)
          error = error || args[0]
          checkDone ()
        } else 
          console.error('group callback called more than once. ignored.')
      })

      started ++
      seq(steps).apply(null,_args)
    })

    ready = true
    checkDone()
  }
  
  if(done)
    funx(done)
  else 
    return funx
}

exports.defer = function (obj,commands){

  var called = []
  commands.forEach(function (name){
    obj[name] = function (){
      called.push({name: name,args: arguments})
    }
  })

  return function (newObj){
    commands.forEach(function (name){
      obj[name] = curry(newObj[name],[],newObj)
    })
    called.forEach(function (cmd){
      newObj[cmd.name].apply(newObj,cmd.args)
    })
    //execute commands, and then hook to the regular methods.
  }
}

exports.width = Queue

function Queue(jobs,width){
  if(!(this instanceof Queue)) return new Queue(jobs,width)

  var self = this
  
  if(!jobs)
    throw new Error("ctrlflow.width cannot process " + jobs + ", expected an array")
  
  this.keys = Object.keys(jobs)
  this.running = 0
  this.jobs = jobs
  this.width = width || 1
  this.done = function (){}
  
  this.start = function (){
    var k = self.keys.shift()
    self.running ++
    self.func(self.jobs[k],k,self.jobs)
  }
  
  this.next = function (){
    self.running --
    if(self.keys.length){
      self.start()
    } else if (self.running == 0){
        self.done()
    }
  }
}

Queue.prototype = {

  forEach: 
    function (func,done){
      this.func = func
      this.done = done || this.done 
      var i = 0
      while(i++ < this.width && this.keys.length)
        this.start()
    }
}
function toArray (args){
  var a = []
  for(var i = 0; i < args.length; i ++)
    a.push(args[i])
  return a
}

var step = exports.step = function (s) {
  //return a function.
  
  // [function, arg1, arg2,...] 
  // call function with these args instead of what the last function callbacked
  if(Array.isArray(s)) {
    return function () {
      var cb = [].pop.call(arguments)
        , args = s
      s = args.shift()
      args.push(cb)
      s.apply(this,args)
    }
  } 
  // call a group of function in parallel
  if ('object' === typeof s) {
    return group(s)
  }
  //just a normal function
  return s
}

exports.toAsync = d.toAsync
//
// I want to refactor this into something more elegant. 
// I think it's the difference between the fist/last steps and the other steps that is causing
//

function seq () {

  var _array = Array.isArray(arguments[0]) 
        ? [].shift.call(arguments) 
        : [].slice.call(arguments)

// return function that shifts the first step, calls it with args the args, and passes

  return function (){
    var array = _array.slice()
      , self = this
      , isDone = false
      , index = 0
      , done = function () {}  
// done = 'function' == typeof this.next ? this.next : [].pop.apply(arguments) //test for this.
    var args = toArray(arguments)
    if(!d.empty(args) && 'function' == typeof d.last(args))
      done = args.pop()

    args.unshift(null)//add a fake null error (so that next is always called like a callback.
    next.apply(null,args)

    function next (){
      var f
        , args = toArray(arguments)
        , current = index ++
        ;
      //skip null items.
      while(!(f = array.shift()) && array.length) current = index ++;
      if(!f) {
        isDone = true
        return done.apply(null, args)
      }

      var err = args.shift()
      if(err) {
        if(err && err.message)
          err.stack = '(at ctrlflow step:' + current + '):' + err.stack
        return isDone = true, done(err) //callback on any error
      }
      f = step(f)

      var n = 0
      function _next () {
        if(!(n ++) && !isDone) {
          next.apply(null,[].slice.call(arguments))
        }
        else {
          console.error('next called more than once! in step:' + current)
          if(n > 1)
            console.error('called ' + n + ' times')
          if(isDone)
            console.error('called after finished')
          console.error(new Error().stack )
        }
      }
      args.push(_next)
      try{
        //get rid of this and this.next()
        //IO is the best time for a ctrlflow lib, 
        //OO seems to fit IO
        f.apply(self === global ? {next: _next} : self, args)
      } catch (err){
        if(isDone)
          throw err
        isDone = true
        return done(err)
      }
    }
  }
}

//return a function(array, callback) that will apply an iteration to an array in parrallel
//usally, you wont need the key, so ignore it by default?

parallel.map = function (iterator, useKey) {
  return function (obj, callback) {
    if(!obj)
      return callback(null, obj)
    var results = Array.isArray(obj) ? [] : {}
      , errors = []
      , isDone = false
      , called = 0
      , finished = 0
      , started = false

    d.each(obj, function (value, key) {
      called ++
      function next (err, result) {
        finished ++
        if(err)
          errors.push(err)
          //return isDone = true, callback(err)
        results[key] = result
        if(started && finished == called) {
          isDone = true, callback(maybeManyErrors(errors), results)
        }
      }
        var safe = d.safe(iterator)
        if (useKey) safe(value, key, next)
        else safe(value, next)
    })

    started = true
    if(finished == called ) //incase the callbacks where actualy syncronous.
      isDone = true, callback(maybeManyErrors(errors), results)
    
  }
}

function maybeManyErrors(errors) {
  if(!errors.length)
    return null
  if(errors.length == 1)
    return errors[0]
  var err = new Error('many errors occured during async operation')
  err.errors = errors
  return err
}

serial.map = function (iterator, useKey) {
  return function (obj, callback) {
    if(!obj)
      return callback(null, obj)
    var results = Array.isArray(obj) ? [] : {}
      , errors = []
      , keys = Object.keys(obj)
      , isDone = false
      , started = false

    function step() {
      if(!keys.length && !isDone) 
        return isDone = true, callback(maybeManyErrors(errors), results)

      var key = keys.shift()
      var value = obj[key]
      function next (err, result) {
        if(err)
          errors.push(err)
//          return isDone = true, callback(err)
        results[key] = result
        step()
      }
        var safe = d.safe(iterator)
        if (useKey) safe(value, key, next)
        else safe(value, next)
    }
    step()    
  }
}
