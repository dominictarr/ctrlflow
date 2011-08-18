
var curry = require('curry')
  , d = require('d-utils')

function findErr (funx){
  for(var i in funx){
    if(funx[i].arguments[0])
      return funx[i].arguments[0]
  }
}

var group = exports.group = function (groups,done) {

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
          results[name] = args
          error = error || args[0]
          checkDone ()
        } else 
          console.log('group callback called more than once. ignored.')
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

//
// I want to refactor this into something more elegant. 
// I think it's the difference between the fist/last steps and the other steps that is causing
//

var seq = exports.seq = function (){

  var _array = Array.isArray(arguments[0]) 
        ? [].shift.call(arguments) 
        : [].slice.call(arguments)
    , done = function () {}  

// return function that shifts the first step, calls it with args the args, and passes

  return function (){
    var array = _array.slice()
    var isDone = false
// done = 'function' == typeof this.next ? this.next : [].pop.apply(arguments) //test for this.
    var args = toArray(arguments)
    if(!d.empty(args) && 'function' == typeof d.last(args))
      done = args.pop()

    args.unshift(null)//add a fake null error (so that next is always called like a callback.
    next.apply(null,args)

    function next (){
      var f
        , args = toArray(arguments)

      while(!(f = array.shift()) && array.length) ;

      if(!f) {
        isDone = true
        return done.apply(null, args)
      }

      var err = args.shift()
      if(err) return isDone = true, done(err) //callback on any error

      f = step(f)

      var n = 0
      function _next () {
        if(!(n ++))
          next.apply(null,[].slice.call(arguments))
        else
          console.log('next called more than once! oops!')
      }
      args.push(_next)
      try{
        f.apply({next:_next},args)
      } catch (err){
        if(isDone)
          throw err
        isDone = true
        return done(err)
      }
    }
  }
}
