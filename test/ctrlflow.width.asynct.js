var qw = require('ctrlflow').width
  , it = require('it-is')

function checkForEach(obj,done){
  var r = []
  
  obj.forEach(function (v,k,o){
    var n = this.next
    it(o).property(k,v)
    r.push(v)
    if(n)
      setTimeout(n,0)
  },done)
  
  return function (){
    return r
  }
}

exports ['for each is normal'] = function (test){

 var a = [1,2,3,4,5,6,7,8,9,0]
 
   , sync = checkForEach(a)()
   , async = checkForEach(qw(a,1),done)

  function done(){
    it(async()).deepEqual(sync)
    test.done()
  }
}


exports ['process 3 items at a time'] = function (test){

 var a = [1,2,3,4,5,6,7,8,9,0]
 
   , sync = checkForEach(a)()
   , async = checkForEach(qw(a,3),done)

  it(async()).deepEqual([1,2,3])

  function done(){
    it(async()).deepEqual(sync)
    test.done()
  }
}

exports ['process 5 items at a time'] = function (test){

 var a = [1,2,3,4,5,6,7,8,9,0]
 
   , sync = checkForEach(a)()
   , async = checkForEach(qw(a,5),done)

  it(async()).deepEqual([1,2,3,4,5])

  function done(){
    it(async()).deepEqual(sync)
    test.done()
  }
}

exports ['if chunk if larger than array.length'] = function (test){

 var a = [1,2,3,4,5,6,7,8,9,0]
 
   , sync = checkForEach(a)()
   , async = checkForEach(qw(a,100),done)

  it(async()).deepEqual(a)

  function done(){
    it(async()).deepEqual(sync)
    test.done()
  }
}

