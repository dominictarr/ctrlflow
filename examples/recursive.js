
//
// switch the names of two files.
//

var ctrl    = require('../')
  , path    = require('path')
  , fs      = require('fs')
  , d       = require('d-utils')
  , rec = {}
  

function rec (dir, callback) {
  ctrl([
    [fs.lstat, dir], //check is file
    function (stat, callback) {
      callback(!stat.isDirectory)
    },
    [fs.readdir, dir],
    function (list, callback) {
      var ls = 
        d.mapKeys(list, function (key) {
          return [[d.tryCatchPass(rec, function (err, callback) {
            if(err === true)
              callback()
            else callback(err)    
          }, d.fallthrough), path.join(dir, key)]]
        })
      console.log(ls)      
      ctrl([ls])(callback)
    }
  ])(callback)
}
rec(process.cwd(), console.log)