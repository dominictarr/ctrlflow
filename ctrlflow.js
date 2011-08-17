
var curry = require('curry')
  , d = require('d-utils')
/*
  group: get the cb's of several functions.
*/

function findErr (funx){
  for(var i in funx){
    if(funx[i].arguments[0])
      return funx[i].arguments[0]
  }
}

exports.group = function (groups,done) {
  var c = 0, i = 0, funx = [], args = [], called = 0, error = null

  if(!done) done = groups, groups = null
  if(!done)
    done = function (){
      throw new Error("group was never given a 'done' callback")
    }
  var group =
  function group (name){
    c++
    var x = name || i ++
    funx[x] = function (){
      if(args[x])
        throw new Error ('function called twice')
      args[x] = arguments
      error = error || arguments[0]
      called ++
      if(called === c){
        done(error, args)
      }
    }

    return funx[x]
  }

  if(groups) {
    d.each(groups, function (value,key) {
      var cb = group(key)
      if('function' !== typeof value)
        exports.seq([value])(cb)
      else
        value.apply({next: cb}, [cb])
    })
  }

  group.done = function (_done){
    done = _done
    return group
  }
  return group
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

exports.seq = function (){
  var _array = [].concat(Array.isArray(arguments[0]) ? [].shift.apply(arguments) : [])
    , onError = [].pop.apply(arguments)
    , done = function (){}

return function (){
    var array = _array.slice()
    var isDone = false
// done = 'function' == typeof this.next ? this.next : [].pop.apply(arguments) //test for this.
    var args = toArray(arguments)
    if(!d.empty(args) && 'function' == typeof d.last(args))
      onError = done = args.pop()
    args.unshift(null)//add a fake null error (so that next is always called like a callback.
    next.apply(null,args)

    function next (){
      var f = array.shift()
      args = toArray(arguments)

      if(!f) {
        isDone = true
        return done.apply(null,args)
      }

      var err = args.shift()
      if(err) return isDone = true, done(err) //callback on any error

      if(Array.isArray(f)) {
        args = f
        f = args.shift()
      } else if ('object' === typeof f) {
          var grp = f
          f = function () {
          var args = [].slice.call(arguments)
            , cb = args.pop()
            exports.group(grp, cb)
          }
      }
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
