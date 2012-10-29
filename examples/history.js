// npm install mongoose
var     PubSub      = require('../lib/pubsub/pubsub') 
    ,   Mongoose    = require('mongoose')

var db = Mongoose.createConnection('localhost', 'history');

var user_history    = {}
var regex_command   = /^!([a-z]+).*/i
var default_channel = "#WSUTech"
var history_per_request = 10;


db.on('error', console.error.bind(console, 'connection error:'));

var SchemaHistory = new Mongoose.Schema({
        nick: String
    ,   text: String
    ,   date: Date
})

function padr(string, size)
{
    var spacer = ' '
    var string = '' + string
    var result = string
    for ( var i = size - string.length; i > 0; i-- )
        result += ' '

    return result;

}

var timer = function (arr, interval, callback) {
    var self = this;

    self.arr      = arr.filter(function (a) { return true })
    self.interval = interval || 500;
    self.index    = 0

    self.id = setInterval(function () {
        if ( self.index == self.arr.length )
            clearTimeout(self.id)
        else
            callback(self.arr[self.index++])
    }, self.interval)
}


db.once('open', function () {

    var History = db.model('History', SchemaHistory)

    PubSub.connect(5050, function (net) {

        function display(who, from, limit) {
            History.find({"date": {"$gte": user_history[who].part, "$lt": user_history[who].join}}, 'nick text', { skip: from, limit: limit }, function(err, results) { 
                if ( err )
                    return console.error('Error: ', err)

                net.publish('client', 'say', {target: who, message: 'History:'})

                if ( results.length == 0 )
                    return net.publish('client', 'say', {target: who, message: '  No history'})

                timer(results, 500, function (data) {
                    net.publish('client', 'say', {target: who, message: '  ' + padr(data.nick, 16) + ' | ' + data.text})
                })

            })
        }

        var commands = {
            'history': function (data) {

                var who = data.nick

                if ( !user_history[who] )
                {
                    user_history[who] = {
                            part: null
                        ,   join: null
                        ,   offset: 0
                    }
                }

                user_history[who].offset = 0
                this.next(data)

            }
        ,   'next': function (data) {
                
                var who = data.nick

                if ( !(user_history[who] && user_history[who].part && user_history[who].join) )
                {
                    net.publish('client', 'say', {target: who, message: 'History: Can not return report.'})
                    return;
                }

                
                var from = user_history[who].offset

                display(who, from, history_per_request)

                // Shift to next set
                user_history[who].offset += history_per_request
            }
        }

        //
        // Catch all the errors!
        //

        net.subscribe('event', 'error', function (topic, pipe, data) {

            console.log(topic, pipe, data)

        })

        //
        // Track when a user parts
        //

        net.subscribe('event', 'part', function (topic, pipe, data) {

            console.log(topic, pipe, data)

            if ( !user_history[data.nick] )
                user_history[data.nick] = {
                        part: null
                    ,   join: null
                    ,   offset: 0
                }

            user_history[data.nick].part = new Date()

        })

        //
        // Track when a user parts
        //

        net.subscribe('event', 'quit', function (topic, pipe, data) {

            console.log(topic, pipe, data)

            if ( !user_history[data.nick] )
                user_history[data.nick] = {
                        part: null
                    ,   join: null
                    ,   offset: 0
                }

            user_history[data.nick].part = new Date()

        })

        //
        // Subscribe to the join event
        //

        net.subscribe('event', 'join', function (topic, pipe, data) {

            console.log(topic, pipe, data)

            if ( !user_history[data.nick] )
                user_history[data.nick] = {
                        part: null
                    ,   join: null
                    ,   offset: 0
                }

            user_history[data.nick].join = new Date()

        })

        //
        // Subscribe to messages
        //

        net.subscribe('event', 'message', function (topic, pipe, data) {

            //console.log(topic, pipe, data)

            //
            // Save each message object to mongo
            //

            // Only save messages to the channel
            if ( data.to[0] == '#' )
            {
                var msg = new History({
                        nick: data.nick
                    ,   text: data.text
                    ,   date: new Date()
                })

                msg.save(function (err) {
                if (err) return console.error(err)
                    console.log('Message saved')
                });
            }

            if ( regex_command.test(data.text) )
            {
                var command = data.text.match(regex_command)[1]

                console.log(command)

                if ( Object.keys(commands).indexOf(command) > -1 )
                    commands[command](data)

            }


        })

        //
        // Publish a loaded message
        //

        net.publish('client', 'say', {target: default_channel, message: "! - [Plugin][Loaded] | History Example"})

    })

});




