
var ctrl = require('ctrlflow')
  , it = require('it-is')

exports ['accept commands but lazy exec'] = function (test){
  var async = {}
  var ready = ctrl.defer(async,['do'])
  
  async.do('hello',function (x){
    it(x).equal('hello')
    test.done()
  })

  var __async = {do: function (hi,funx){funx(hi)} }
  ready(__async)
}

exports ['accept commands but lazy exec, non lazy when ready'] = function (test){
  var async = {}
  var ready = ctrl.defer(async,['do'])
  var called = false
  
  async.do('hello',function (x){
    it(x).equal('hello')
    called = true
  })

  var __async = {do: function (hi,funx){funx(hi)} }
  ready(__async)
  it(called).equal(true)
  async.do('goodbye',function (x){
    it(x).equal('goodbye')
    test.done()
  })

}