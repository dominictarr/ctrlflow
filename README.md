#yet another nodejs async control flow lib#

there are already a number of ndoejs control flow libs, notably, creationix/step and substack/seq and i've investigated them, but decided it's worth inventing your own, so that 

  1. you really understand how it works.
  
control flow is so fundamential... it best to deeply understand it. so, I'm writing my own, and I suspect you should too.

##group##

collect the results of a number of async functions:

    var g = require('ctrlflow').group()

    func1(args,g())//g() will return a function collect it's args for g.done
    func2(args,g())
    func3(args,g())

    g.done(function (){
      console.log("func1,2,3 called back")
    })

also, you can pass the calback directly into group():

    var g = require('ctrlflow').group(function (){
      console.log("func1,2,3 called back")
    })

    func1(args,g())//g() will return a function collect it's args for g.done
    func2(args,g())
    func3(args,g())

##seq##

serial execution of a list of functions.

    ctrl.seq([
      function (x){
        ...
        this.next(null,1)
      },
      function (err,x){
        ...
        this.next(null,2)
      },
      function (err,x){
    }])(0)
    
but also, custom error handling.

    ctrl.seq([
      function (x){
        ...
        this.next(null,1)
      },
      function (err,x){
        ...
        this.next(null,2)
      },
      function (err,x){
    }]).error(function (){
      //handle error
    })(0)

by default errors are thrown. execution of sequence stops if there is an error.

##curried callbacks ##

the callback is also added to the end of the argument list.

    ctrl.seq([
      function (x,next){
        ...
        next(null,1)
      },
      function (err,x,next){
        ...
        next(null,2)
      },
      curry(asyncFunction)
      ])(0)




##defer##

sometimes you have a object that needs an async start up before certain methods are called. 

`ctrlflow.defer()` can be used to record async method calls, and play them back when the reciever is ready:

    var async = {}//object to add defurred methods to,
    var ready = ctrl.defer(async,['do'])//defer(obj,listOfMethodNames) 
                                        //-> returns ready(obj) method, for when functions can be executed.

    //can call named methods on the object.
    //they will not be executed yet.
    async.do('hello',function (x){
      console.log('.do() called back:',x)
    })

    var __async = {do: function (hi,funx){funx(hi)} }
    //call ready(ObjectWhichHasRealFunctions) when it's time.
    ready(__async)

    //from now on, calls will be executed immediately.
    async.do('goodbye',function (x){
      console.log('.do() called back again:',x)
    })
