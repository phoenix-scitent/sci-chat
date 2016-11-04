const NUM_HISTORY_CHATS = 10;

var ecstatic = require('ecstatic');
var st = ecstatic(__dirname + '/public');

var levelup = require('levelup');
var db = levelup(__dirname + '/history', {keyEncoding:'utf8', valueEncoding:'json'});
var put = function(key,value,callback) {
  db.put(key,value,callback);
}
var get = function(key,callback) {
  db.get(key,callback);
}
var getPrevious = function(limit,callback) {
  db.createReadStream({limit:limit,reverse:true})
    .on('data',function(data){
    // also available: data.key
    callback(data.value);
  });
}

var http = require('http');
var server = http.createServer(function (req, res) {
  st(req, res);
});
var unicodes = require('./unicodes.js');

var port = 5000;

server.listen(port);
console.log('Server running @ port ' + port);

var wsock = require('websocket-stream');
var split = require('split2');
var through = require('through2');
var onend = require('end-of-stream');

var streams = [];

wsock.createServer({ server: server }, function(stream){

  streams.push(stream);

  onend(stream, function () {
    var ix = streams.indexOf(stream);
    if (ix >= 0) streams.splice(ix, 1)
  });

  getPrevious(10,stream.write);
  //stream.write(get);

  stream
    .pipe(split())
    .pipe(through(function(line, enc, next){ 
      var id = streams.indexOf(stream)
      write(unicodes[id] + ': ' + line, enc, next); 
      persist({id:id,line:line});
    }));

  function write(line, enc, next){
    streams.forEach(function(stream,index){
      stream.write(line + '\n');
    });
    next();
  }

  function persist(obj) { // put stores key, value.  Here: timestamp, obj
    var time = process.hrtime().join('');
    put(time,obj,function(err){
      get(time,function(err,value){
        console.log(value);
      });
    });
  }
});