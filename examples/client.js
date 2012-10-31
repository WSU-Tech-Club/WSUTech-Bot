PubSub = require('../lib/pubsub/pubsub') 
PubSub.connect({}, function (net) {

    net.subscribe('event', 'message', function (topic, pipe, data) {
        console.log(topic, pipe, data)
    });


    net.publish('client', 'say', {target: "#wsutech", message: "Hello! This is a test of the PubSub network."});
});
