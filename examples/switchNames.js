
//
// switch the names of two files.
//

var ctrl    = require('../')
  , path    = require('path')
  , fs      = require('fs')
  , file1   = process.argv[2] && path.resolve(process.argv[2])
  , file2   = process.argv[3] && path.resolve(process.argv[3])

//switch filenames of two files.

function switchFiles (f1, f2, callback) {
  var tmp = f1 + '_tmp'
  ctrl([
    [fs.rename, f1  , tmp ],
    [fs.rename, f2  , f1  ],
    [fs.rename, tmp , f2  ],
  ])(callback)
}

//log the first 100 characters of a file

var cat100 = 
  ctrl([
    fs.readFile,
    ctrl.toAsync(function (buffer) {
      return buffer.toString().slice(0,100)
    })
  ])

//switch the names of two files, then log their first 100 chars, al get an directory listing too.
if(!file1 || !file2) {
  file1 = path.join(__dirname, 'hello.txt')
  file2 = path.join(__dirname, 'bye.txt')
  console.log('try `cd ctrlflow/examples && node switchNames.js hello.txt bye.txt`')
}
ctrl([
  [switchFiles, file1, file2],
  {
    file1: [[cat100, file1]],
    file2: [[cat100, file2]],
    ls: [[fs.readdir, __dirname]]
  }
  ])
(function (err, data) {
  if(err) throw err
  console.log(data)
})
