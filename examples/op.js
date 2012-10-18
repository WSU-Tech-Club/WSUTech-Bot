PubSub = require('../lib/pubsub/pubsub') 

//
// Usernames that have access to commands, this could be populated via some
// persistent store
//

var usernames = ['Kjerski']

PubSub.connect(5050, function (net) {

    //
    //  Subscribe to the join event
    //

    net.subscribe('event', 'join', function (topic, pipe, data) {
    
        // Log to console
        console.log(topic, pipe, data)
        
        //
        // Op the user if they are in our username list
        //
        
        if (usernames.indexOf(data.nick) > -1 )
            net.publish('client', 'send', {args: ['MODE', data.channel, '+o', data.nick]})

    });

    //
    // Subscribe to the message event
    //

    net.subscribe('event', 'message', function (topic, pipe, data) {

        var parts = data.text.split(' ')
        var command = parts.shift()

        var respond_to = data.to
       
        if ( respond_to[0] != '#' )
            respond_to = data.nick
        
        var commands = {
                '!autoop': function () {
                    var nick = parts.shift()
                    usernames.push(nick)
                }
            ,   '!autooplist': function () {
                    net.publish('client', 'say', {target: respond_to, message: 'I will autoop the following users: ' + usernames.join(', ')})
                }

        }

        if ( Object.keys(commands).indexOf(command) == -1 )
            return;

        if (usernames.indexOf(data.nick) > -1 ) 
        {
            commands[command]();    
        }
        else
        {
            net.publish('client', 'say', {target: respond_to, message: 'Wooh Woooh there buddy, I don\'t know you that well.'})
        }
    
    })

    //
    // Publish a loaded message
    //

    net.publish('client', 'say', {target: "#wsutech", message: "! - [Plugin][Loaded] | Op Example"});
});
