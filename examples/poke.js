// npm install twilio 

PubSub          = require('../lib/pubsub/pubsub') 
TwilioClient    = require('twilio').Client
Twiml           = require('twilio').Twiml
creds           = require('./twilio-config.js')

var client = new TwilioClient(creds.sid, creds.authToken, creds.hostname)
var phone  = client.getPhoneNumber(creds.incoming) 

var users   = {};
var limiter = {};

PubSub.connect(5050, function (net) {

    //
    // Subscribe to the message event
    //

    net.subscribe('event', 'message', function (topic, pipe, data) {

        var parts   = data.text.split(' ')
        var command = parts.shift()

        var respond_to = data.to
       
        if ( respond_to[0] != '#' )
            respond_to = data.nick
 
        var commands = {
            '!pokeset': function () {
                var number = parts.shift()

                // You'd also want to check for a valid number
                users[data.nick] = number

                net.publish('client', 'say', {target: respond_to, message: 'Your number has been set ['+number+']'})
            }
        ,   '!poke': function () {
                var nick   = parts.shift()
                var number = users[nick]    
            
                if ( !users[nick])
                {
                    net.publish('client', 'say', {target: respond_to, message: 'Oh No! I can\'t find a number for that user.'})
                    return;
                }

                limiter[data.nick] = (new Date).getTime()    

                phone.sendSms(number, data.nick + ' has summoned you!', null, new Function)
                net.publish('client', 'say', {target: respond_to, message: 'Message sent to ' + nick})
            }
        ,   '!pokebook': function () {
                
                net.publish('client', 'say', {target: respond_to, message: 'Pokebook'})

                for ( var nick in users )
                    net.publish('client', 'say', {target: respond_to, message: ' - ' + nick})

            }

        }

        if ( Object.keys(commands).indexOf(command) == -1 )
            return;

        if ( limiter[data.nick] && (limiter[data.nick] + 1000 * 60 * 5) > (new Date).getTime() )
        {
            var wait_time = (limiter[data.nick] + 1000 * 60 * 5) - (new Date).getTime()
                wait_time /= 1000

            net.publish('client', 'say', {target: respond_to, message: 'Please wait ' + wait_time + ' seconds to poke again.'})

            return;
        }

        commands[command]();    
    
    })

    net.publish('client', 'say', {target: "#wsutech", message: "! - [Plugin][Loaded] | Twilio Poke Example"});

})
