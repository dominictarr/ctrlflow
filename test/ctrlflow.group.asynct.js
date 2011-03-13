
var ctrl = require('ctrlflow')
  , it = require('it-is')
  , curry = require('curry')

exports.group = function (test){
  var g = ctrl.group(function (err,results){
    it(err).equal(null)
    it(results).property('length',3)
    test.done()
  })
  
  setTimeout(g(),100)
  setTimeout(g(),50)
  setTimeout(g(),150)
  
}

exports['group with error'] = function (test){
  var error = new Error("ERR")
    , g = ctrl.group(function (err,results){
    it(err).equal(error)
    it(results).property('length',3)
    test.done()
  })

  setTimeout(g(),100)
  f = g()
  setTimeout(function () {
    f(error)
  },50)
  setTimeout(g(),150)
}

exports['group with args'] = function (test){
  var error = new Error("ERR")
    , g = ctrl.group(function (err,results){
    it(err).equal(error)
    it(results).property('length',3)
    it(results).has([
      [null,1,2,3]
    , [it.equal(error),"message!"]
    , [null,{obj: 54}]
    ])
    test.done()
  })

  setTimeout(curry(g(),[null,1,2,3]),100)
  setTimeout(curry(g(),[error,"message!"]),50)
  setTimeout(curry(g(),[null,{obj: 54}]),150)
}


exports.group2 = function (test){
  var g = ctrl.group()
  
  setTimeout(g(),100)
  setTimeout(g(),50)
  setTimeout(g(),150)
  
  g.done(function (err,results){
    it(err).equal(null)
    it(results).property('length',3)
    test.done()
  })
}

exports['group with error 2'] = function (test){
  var error = new Error("ERR")
    , g = ctrl.group()

  setTimeout(g(),100)
  f = g()
  setTimeout(function () {
    f(error)
  },50)
  setTimeout(g(),150)
  
  g.done(function (err,results){
    it(err).equal(error)
    it(results).property('length',3)
    test.done()
  })
}

exports['group with args '] = function (test){
  var error = new Error("ERR")
    , g = ctrl.group()
  
  setTimeout(curry(g(),[null,1,2,3]),100)
  setTimeout(curry(g(),[error,"message!"]),50)
  setTimeout(curry(g(),[null,{obj: 54}]),150)
  
  g.done(function (err,results){
    it(err).equal(error)
    it(results).property('length',3)
    it(results).has([
      [null,1,2,3]
    , [it.equal(error),"message!"]
    , [null,{obj: 54}]
    ])
    test.done()
  })
}

