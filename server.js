var ecstatic = require('ecstatic');
var st = ecstatic(__dirname + '/public');
var http = require('http');
var server = http.createServer(function (req, res) {
  st(req, res);
});

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

  stream
    .pipe(split())
    .pipe(through(function(line, enc, next){ write(streams.indexOf(stream) + ':' + line, enc, next) }));

  function write(line, enc, next){
    streams.forEach(function(stream,index){
      stream.write(line + '\n');
    });
    next();
  }

});