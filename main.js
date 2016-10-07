var wsock = require('websocket-stream');
var stream = wsock('ws://' + location.host);

var vdom = require('virtual-dom');
var h = vdom.h
var main = require('main-loop');
var loop = main({ lines: [] }, render, vdom);
document.querySelector('#content').appendChild(loop.target);

var split = require('split2');
var through = require('through2');

stream.pipe(split()).pipe(through(function (line, enc, next) {
  var lines = loop.state.lines;
  lines.push(line.toString());
  loop.update({ lines: lines.slice(-10) }); // keep only the 10 most recent lines
  next()
}));

function render (state) {
  return h('div', [
    h('div.lines', state.lines.map(function (line) {
      return h('pre', line)
    })),
    h('form', { onsubmit: chat }, [
      h('input', { type: 'text', name: 'msg' })
    ])
  ])
  function chat (ev) {
    ev.preventDefault();
    stream.write(this.elements.msg.value + '\n');
    this.reset()
  }
}