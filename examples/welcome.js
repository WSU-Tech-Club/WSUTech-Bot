PubSub = require('../lib/pubsub/pubsub') 
PubSub.connect(5050, function (net) {

    net.subscribe('event', 'error', function (topic, pipe, data) {

        console.log(topic, pipe, data);

    })

    //
    //  Subscribe to the join event
    //

    net.subscribe('event', 'join', function (topic, pipe, data) {
    
        // Log to console
        console.log(topic, pipe, data)
        
        //
        // Publish a message
        //
        
        net.publish('client', 'say', {target: data.channel, message: "Hello " + data.nick + "!"})
        
        //
        // Perform a whois lookup and accept the answer as a callback function
        //

        net.publish('client', 'whois', {nick: data.nick}, function (data) {
            console.log("whois: ", data.info)
        });

    });

    //
    // Publish a loaded message
    //

    net.publish('client', 'say', {target: "#wsutech", message: "! - [Plugin][Loaded] | Welcome Example"});
});
