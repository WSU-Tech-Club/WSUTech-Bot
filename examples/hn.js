// npm install xml2.js request

PubSub = require('../lib/pubsub/pubsub') 
xml2js = require('xml2js')
request = require('request')

var parser = new xml2js.Parser()



var newsItems_ = {
        last: 0
    ,    items: []    

}

function newsItems(cb) {
    
    if ( newsItems_.last + (1000 * 60 * 5) > (new Date).getTime() )
    {
        console.log('served cach')
        cb(null, newsItems_.items)
    }
    else
    {    
        request({uri: 'http://news.ycombinator.com/rss'}, function ( err, res, body) {
            var self = this
            if ( err && response.statusCode !== 200 )
                return console.log('Request failed')

            parser.parseString(body, function (err, result) {
                newsItems_.last = (new Date).getTime()
                newsItems_.items = result.rss.channel[0].item.slice(0,5)
                cb(null, newsItems_.items)
            });
        })
    }
}


PubSub.connect(5050, function (net) {


    net.subscribe('event', 'message', function (topic, pipe, data) {

        var parts = data.text.split(' ')
        var command = parts.shift()

        var respond_to = data.to
       
        if ( respond_to[0] != '#' )
            respond_to = data.nick
        
        var commands = {
            '!hackernews': function () {
                newsItems(function (err, items) {
                    for ( var i = 0; i < items.length; i++ )
                    {
                        net.publish('client', 'say', {target: respond_to, message: (i+1) + ": " + items[i].title[0] + " - " + items[i].comments[0] })
                    }
                })
            }
        }

        if ( Object.keys(commands).indexOf(command) == -1 )
            return;

        commands[command]();    
    
    })


    net.publish('client', 'say', {target: "#wsutech", message: "! - [Plugin][Loaded] | Hacker News Example"});


})
