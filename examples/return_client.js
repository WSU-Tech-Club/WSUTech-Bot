PubSub = require('./bot') 

PubSub.start(5050)

net = PubSub.connect(5050);

net.subscribe('foo', 'data', function (topic, pipe, data) {
    console.log(topic, pipe, data)
});

net.subscribe('bar', 'data', function (topic, pipe, data) {
    console.log(topic, pipe, data)
});

var foo = 0;
var bar = 0;

setInterval(function () {
    net.publish('foo', 'data', foo++);
}, 5000);

setInterval(function () {
    net.publish('bar', 'data', bar++);
}, 7000);

setInterval(function () {
    console.log("Connected: ", net.connected);
}, 1000);

