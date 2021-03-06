var PubSub  = require("./pubsub/pubsub")
var IRC     = require("irc")

var DistroBot = exports.bot = function (options) {
   
    var self = this

    self.nick       = options.nick          || 'DistroBot'
    self.password   = options.password      || null

    options.userName             = options.userName              || 'DistroBot'
    options.realName             = options.realName              || 'DistroBot'
    options.port                 = options.port                  || 6667
    options.debug                = options.debug                 || false
    options.showErrors           = options.showErrors            || false
    options.autoRejoin           = options.autoRejoin            || true
    options.autoConnect          = options.autoConnect           || true
    options.channels             = options.channels              || []
    options.secure               = options.secure                || false
    options.selfSigned           = options.selfSigned            || false
    options.certExpired          = options.certExpired           || false
    options.floodProtection      = options.floodProtection       || false
    options.floodProtectionDelay = options.floodProtectionDelay  || 1000
    options.stripColors          = options.stripColors           || false

    self.options = options

}

DistroBot.prototype.start = function (port) {

    var self = this

    PubSub.start( 5050 );

    PubSub.connect( 5050, function (pubsub) {
        self.net        = pubsub;
        self.ircClient  = new IRC.Client(self.options.server, self.options.nick, self.options);
        
        self.ircClient.on('connect', function () {
            self._IRC_init();
        });

    });
}

DistroBot.prototype._IRC_init = function () {
    var self = this

    //
    // IRC Subscription messages
    //
    
    self.net.subscribe('client', 'send', function (topic, pipe, data) {
        console.log(data)
        self.ircClient.send.apply(self.ircClient, data.args)
    });

    self.net.subscribe('client', 'join', function (topic, pipe, data, cb) {
        self.ircClient.join(data.channel, function () {
            if ( cb != undefined) cb(arguments) 
        })
    });

    self.net.subscribe('client', 'part', function (topic, pipe, data, cb) {
        self.ircClient.part(data.channel, function () {
            if ( cb != undefined) cb(arguments)
        })
    });

    self.net.subscribe('client', 'say', function (topic, pipe, data) {
        self.ircClient.say(data.target, data.message)
    });
    
    self.net.subscribe('client', 'ctcp', function (topic, pipe, data) {
        self.ircClient.ctcp(data.target, data.type, data.text)
    });
    
    self.net.subscribe('client', 'action', function (topic, pipe, data) {
        self.ircClient.action(data.target, data.message)
    });
    
    self.net.subscribe('client', 'notice', function (topic, pipe, data) {
        self.ircClient.notice(data.target, data.message)
    });
    
    self.net.subscribe('client', 'whois', function (topic, pipe, data, cb) {
        self.ircClient.whois(data.nick, function (info) {
            if ( cb != undefined) cb({info:info})
        })
    });

    //
    // IRC Publishing messages
    //

    self.ircClient.on('registered', function (message) {
        self.net.publish('event', 'registered', {
                message: message
        });
    });

    self.ircClient.on('motd', function (motd) {
        self.net.publish('event', 'motd', {
                motd: motd
        });
    });
    
    self.ircClient.on('names', function (channel, nicks) {
        self.net.publish('event', 'names', {
                channel: channel
            ,   nicks: nicks
        });
    });

    self.ircClient.on('topic', function (channel, topic, nick, message) {
        self.net.publish('event', 'registered', {
                channel: channel
            ,   topic: topic
            ,   nick: nick
            ,   message: message
        });
    });
    
    self.ircClient.on('join', function (channel, nick, message) {
        self.net.publish('event', 'join', {
                channel: channel
            ,   nick: nick
            ,   message: message
        });
    });

    self.ircClient.on('part', function (channel, nick, reason, message) {
        self.net.publish('event', 'part', {
                channel: channel
            ,   nick: nick
            ,   reason: reason
            ,   message: message
        });
    });

    self.ircClient.on('quit', function (nick, reason, channels,  message) {
        self.net.publish('event', 'quit', {
                nick: nick
            ,   reason: reason
            ,   channels: channels
            ,   message: message
        });
    });

    self.ircClient.on('kick', function (channel, nick, by, reason, message) {
        self.net.publish('event', 'kick', {
                channel: channel
            ,   nick: nick
            ,   by: by
            ,   reason: reason
            ,   message: message
        });
    });

    self.ircClient.on('kill', function (nick, reason, channels, message) {
        self.net.publish('event', 'kill', {
                nick: nick
            ,   reason: reason
            ,   channels: channels
            ,   message: message
        });
    });

    self.ircClient.on('message', function (nick, to, text, message) {
        self.net.publish('event', 'message', {
                nick: nick
            ,   to: to
            ,   text: text
            ,   message: message
        });
    });

    self.ircClient.on('notice', function (nick, to, text, message) {
        self.net.publish('event', 'notice', {
                nick: nick
            ,   to: to
            ,   text: text
            ,   message: message
        });
    });

    self.ircClient.on('pm', function (nick, text, message) {
        self.net.publish('event', 'pm', {
                nick: nick
            ,   text: text
            ,   message: message
        });
    });

    self.ircClient.on('ctcp', function (from, to, text, type) {
        self.net.publish('event', 'ctcp', {
                from: from
            ,   to: to
            ,   text: text
            ,   type: type
        });
    });

    self.ircClient.on('ctcp-notice', function (from, to, text) {
        self.net.publish('event', 'ctcp-notice', {
                from: from
            ,   to: to
            ,   text: text
        });
    });

    self.ircClient.on('ctcp-privmsg', function (from, to, text, type) {
        self.net.publish('event', 'ctcp-privmsg', {
                from: from
            ,   to: to
            ,   text: text
        });
    });

    self.ircClient.on('ctcp-version', function (from, to) {
        self.net.publish('event', 'ctcp-version', {
                from: from
            ,   to: to
        });
    });

    self.ircClient.on('nick', function (oldnick, newnick, channels, message) {
        self.net.publish('event', 'nick', {
                oldnick: oldnick
            ,   newnick: newnick
            ,   channels: channels
            ,   message: message
        });
    });

    self.ircClient.on('invite', function (channel, from, message) {
        self.net.publish('event', 'invite', {
                channel: channel
            ,   from: from
            ,   message: message
        });
    });

    self.ircClient.on('+mode', function (channel, by, mode, argument, message) {
        self.net.publish('event', '+mode', {
                channel: channel
            ,   by: by
            ,   mode: mode
            ,   argument: argument
            ,   message: message
        });
    });

    self.ircClient.on('-mode', function (channel, by, mode, argument, message) {
        self.net.publish('event', '-mode', {
                channel: channel
            ,   by: by
            ,   mode: mode
            ,   argument: argument
            ,   message: message
        });
    });

    self.ircClient.on('whois', function (info) {
        self.net.publish('event', 'whois', {
                info: info 
        });
    });

    self.ircClient.on('channellist_start', function () {
        self.net.publish('event', 'channellist_start', {
                channel_start: true 
        });
    });

    self.ircClient.on('channellist_item', function (channel_info) {
        self.net.publish('event', 'channellist_item', {
                channel_info: channel_info 
        });
    });

    self.ircClient.on('raw', function (message) {
        self.net.publish('event', 'raw', {
                message: message 
        });
    });

    self.ircClient.on('error', function (message) {
        self.net.publish('event', 'error', {
                message: message 
        });
    });
    
}
