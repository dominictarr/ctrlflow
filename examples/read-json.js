
var ctrl   = require('../')
  , path   = require('path')
  , fs     = require('fs')
  , file   = process.argv[2]
  , pathTo = file ? path.resolve(file) : path.join(__dirname, '..', 'package.json')

var go = 
  ctrl([
    fs.readFile,
    function (buffer, callback) {
      callback(null, JSON.parse(buffer.toString()))
    }
  ])

go(pathTo, function (err, obj) {

  if(err)
    throw err //print to stderr and exit
  console.log(obj)

})