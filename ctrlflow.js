
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
        console.log(funx)
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

