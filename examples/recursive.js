
//
// switch the names of two files.
//

var ctrl    = require('../')
  , path    = require('path')
  , fs      = require('fs')
  , d       = require('d-utils')  

    var ls = 
    ctrl([
      function (fn, cb) {
        fs.lstat(fn, function (err, stat) {
          if(err)
            cb(err)
          else {
            stat.name = fn
            cb(null, stat)
          }
        })
      },
      function tryParse (file, cb) {
        if(/package\.json$/.exec(file.name)) {
          try {
            JSON.parse(fs.readFileSync(file.name))
          } catch (err) {
            console.log(file.name, err.message)
          }
          /*ctrl([
            [fs.readFile, file.name, 'utf-8']
          , ctrl.toAsync(JSON.parse)
          , [d.fallthrough, file]
          ])(cb)*/
        }
        //else
          cb(null, file)
      }
    , function (file, next) {
        if(file.isDirectory())
          ctrl([
            [fs.readdir, file.name]
          , function (fn,next) {
              next(null, d.map(d.filter(fn, /^[^.]/), function (v) {return path.join(file.name, v)}))
            }
          , ctrl.parallel.map(ls)
          ])(next)
        else
          next(null, file)
      }
    ])

ls(process.argv[2] || process.cwd(), function (err, data) {
  if(err)
    throw err 
/*  function print(file) {
    if(Array.isArray(file))
      d.each(file, function (f) {
        print(f)
      })
    else
      console.log(file.name)
  }
  print(data)*/
})

  
//ls(process.cwd(), console.log)