#yet another nodejs async control flow lib#

there are already a number of ndoejs control flow libs, notably, creationix/step and substack/seq and I've investigated them, but decided it's worth inventing your own, 
so that I really understand how it works. 
  
async control flow is so fundamential to the node js programmer, 
and your tools should fit your hands perfectly,
so, I'm writing my own, and I suspect you should too.

## ctrl.seq

`ctrl.seq` combines an array of *steps* into one single async callback function.

*steps* are 

  * _async functions_, (callback is last arg, or this.next) 
  function will be called with the callback args of the previous function
  * `[func, arg1, arg2,...]` (arrays with a function as the first arg, )
  `func` will be called with the `arg1, arg2,` etc, instead of the previous callback.
  * object literal of steps. `{a: [STEP], b: [STEP]}` each property will be exectued in parallel.

when a step is called with the args of the previous callback, 
the error argument (the first arg) will be removed.

if the first arg `!= null` the sequence will be terminated and the overall 
callback will be called with the error. see *ERROR HANDLING*

``` js
  var ctrl = require('ctrlflow')
  var go = 
  ctrl.seq([
    function () {
      this.next()
    },
    [asyncFunction, 1, 4, 'hello'],
    { a: function () {this.next() } //a, b, c are executed in parallel
    , b: [
        [asyncFunction, 1]
      , [asyncFunction, 2]
      , [asyncFunction, 3] 
      ]
    , c: { //c itself has two parallel steps!
        x: function () {this.next() } 
      , y: [[asyncFunction]]
      }}
  ])
  //seq returned a function, call it, passing a callback:
  
  go(1, 2, 3, function (err) {
    //passing in a callback that will be called when the sequence is complete
  })

```

## ERROR HANDLING

if any step throws or callsback with an error, 
the callback passed to `go` will be called with the error.
no further steps will be called.


``` js
  var ctrl = require('ctrlflow')
  var go = 
  ctrl.seq([
    function () {
      if(Math.random() < 0.5)
        this.next(new Error('ERROR PASSED TO CALLBACK'))
      else
        throw new Error('ERROR THROWN')
    },
  ])
  //seq returned a function, call it, passing a callback:
  
  go(function (err) {
    //go will get called back with the error every time.
  })

```

## grabbing the callback

the callback is always added as the last argument, and as `this.next`
the best way to get the callback is to pop it off the arguments 

``` js
 var callback = [].slice.call(arguments)
```
