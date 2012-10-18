PubSub = require('../lib/pubsub/pubsub') 
PubSub.connect(5050, function (net) {

    net.subscribe('event', 'join', function (topic, pipe, data) {
        net.publish('client', 'say', {target: data.channel, message: "Hello " + data.nick + "!"})
        var channel = data.channel
        net.publish('client', 'whois', {nick: data.nick}, function (data) {
            console.log("whois: ", data.info)
        });
        console.log(topic, pipe, data)
    });

    net.publish('client', 'say', {target: "#wsutech", message: "! - [Plugin][Loaded] | Welcome Example"});
});
