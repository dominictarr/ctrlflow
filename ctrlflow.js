
var curry = require('curry')
/*
  group: get the cb's of several functions.

*/

function findErr (funx){
  for(var i in funx){
    if(funx[i].arguments[0])
      return funx[i].arguments[0]
  }
}

exports.group = function (done){
  var c = 0, i = 0, funx = [], args = [], called = 0, error = null
  if(!done)
    done = function (){
      throw new Error("group was never given a 'done' callback")
    }
  var group =
  function group (){
    c++
    var x = i ++
    funx[x] = function (){
      if(args[x])
        throw new Error ('function called twice')
      args[x] = arguments
      error = error || arguments[0]
      called ++
      if(called == c){
        done(error, args)
      }
    }
    return funx[x]
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
  var array = [].concat(Array.isArray(arguments[0]) ? [].shift.apply(arguments) : [])
    , onError = [].pop.apply(arguments)
    , done = function (){}
  
  function sequence (){
    if(!onError)
      sequence.throws()

// done = 'function' == typeof this.next ? this.next : [].pop.apply(arguments) //test for this.
    var args = toArray(arguments)
    
    function next (){
      var f = array.shift()
      if(!f)
        return done();
      args = toArray(arguments)
      args.push(next)
      try{
        f.apply({next:next},args)
      } catch (err){
        if(onError)
          onError(err)
        else
          throw err
      }    
    }
    
    next.apply({next:next},args)
  }
  sequence.go = function (){
    sequence()
    return sequence
  }
  sequence.done = function (_done){
    done = _done
    return sequence
  }
  sequence.onError = function (_onError){
    onError = _onError
    return sequence
  }
  sequence.throws = function (){
    done = function (err){ 
      if(!err)
        throw new Error('Threw falsey error:' + err )
      throw err    
    }
    return sequence    
  }
  //option to pass error to next function? no, I can't imagine using that.
  return sequence
}
