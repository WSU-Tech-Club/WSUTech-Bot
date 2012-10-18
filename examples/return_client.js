PubSub = require('../lib/pubsub/pubsub') 

PubSub.start(5050)

net = PubSub.connect(5050);

net.subscribe('foo', 'data', function (topic, pipe, data, cb) {
    console.log(cb)
    if ( cb != undefined ) cb();
    console.log(topic, pipe, data)
});

net.subscribe('bar', 'data', function (topic, pipe, data, cb) {
    if ( cb != undefined ) cb();
    console.log(topic, pipe, data)
});

var foo = 0;
var bar = 0;

setInterval(function () {
    net.publish('foo', 'data', foo++, function () {
        console.log("Callback: ", arguments)
    });
}, 5000);

setInterval(function () {
    net.publish('bar', 'data', bar++);
}, 7000);

