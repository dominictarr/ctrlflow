var ctrl    = require('../')
  , path    = require('path')
  , fs      = require('fs')
  , file1   = path.resolve(process.argv[2])
  , file2   = path.resolve(process.argv[3])

function switchFiles (f1, f2, callback) {
  var tmp = f1 + '_tmp'
  ctrl([
    [fs.rename, f1  , tmp ],
    [fs.rename, f2  , f1  ],
    [fs.rename, tmp , f2  ],
  ])(callback)
}

//
// error here, cannot call a seq in parallel yet!
//

var cat100 = 
//  function (file,cb) {
  ctrl([
    fs.readFile,
    ctrl.toAsync(function (buffer) {
      return buffer.toString().slice(0,100)
    })
  ])//(file,cb)
//}

switchFiles(file1, file2, function (err) {

if(err) throw err

  ctrl([{
    file1: [[cat100, file1]],
    file2: [[cat100, file2]],
    }
  ])(function (err, data) {
    if(err) throw err
    console.log(data)
  })

})