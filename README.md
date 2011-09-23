#ctrlflow#

Asyncronous control flow is important in most node.js programs, 
and it seems that every one has written a library to prevent callbacks getting out of hand. 
most notably, creationix's `step` SubStack's `seq`, isaacs's `slide`, and caolan`s async.

These modules all do somethings right, but still leave room for improvement.
`ctrlflow` combines the best features of these modules with a simple & flexible API and a 
focus on robust error handling.

## var go = ctrl(ArrayOFSteps); go(args,...,callback).

`ctrl` takes an array of steps, and combines them into one asyncronous function that will call 
each step in sequence, and callback when the last step finishes, or when a step errors.

each step is wrapped in a try ... catch, and if a function throws, 
it will stop executing the steps and pass the error to the final callback.

##basic example

``` js
var go = 
  ctrl([
    fs.readFile,
    function (buffer, callback) {
      callback(null, JSON.parse(buffer.toString()))
    }
  ])

go('/path/to/config.json', function (err, obj) {
  if(err)
    throw err //print to stderr and exit
  console.log(obj)
})
```

This example illistrates several things. 
Firstly, `seq` returns an ayncronous function, `go`.
The args passed to `go` are passed to the first step, `fs.readFile`, 
and the results of `fs.readFile` (minus the err parameter) are passed to the second step, 
which parses the file, then callsback.

If the file does not exist, readFile will callback with an error. 
If the file exists, but is not valid JSON, `JSON.parse` will throw syncronously. 
(this will be caught be `seq`, so beware that mulitple types of errors be passed to the callback.

##parallel group example

Sometimes you want to several async steps in parallel, ctrlflow has a literal syntax for this too!

a simple usecase for this is to call stat on a file, and, just incase it is a symbolic link, 
call lstat as well. (lstat will stat the link file, not the file it links to)

``` js
ctrl([{
  stat: fs.stat
  lstat: fs.lstat
}])
(filename, function (err, stats) {
  console.log(stats)
})  

```

##all together

``` js
  var ctrl = require('ctrlflow')
  var go = 
  ctrl.seq([
    function () {
      //call the next step
      this.next()
    },
    [asyncFunction, 1, 4, 'hello'], // short for: function () {asyncFunction(1, 4, 'hello', this.next)}
    { a: function () {this.next() } // a, b, c are executed in parallel
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
    //passing in a callback that will be called when the entire tree/sequence is complete
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

