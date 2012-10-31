var DNode           = require('dnode')
var EventEmitter    = require('events').EventEmitter; 
var Winston         = require('winston')

var logger = new (Winston.Logger)({
    transports: [
            new (Winston.transports.Console)()
    ]
});

logger.cli()

var subscriptions = {}

exports.start = function (op) {
    
    if ( typeof op === 'number')
    {
        var port = op;
        op = {
            port: port
        }
    }

    op.port = op.port || 5050
    op.host = op.host || '127.0.0.1'

    var d = DNode(function (client, conn) {

        logger.info("New client connected"); 
        this.subscribe = function (topic, emit) {
            if( subscriptions[topic] === undefined )
                subscriptions[topic] = {}

            logger.info("Client " + conn.id + " subscribed too " + topic)

            subscriptions[topic][conn.id] = {
                emit: emit
            }

            conn.on('end', function () {
                delete subscriptions[topic][conn.id];
            })
        }

        this.publish = function (topic, pipe, data, cb) {
            logger.info("Publish topic [" + topic + "] pipe [" + pipe +"]")
            
            var emitters = subscriptions[arguments[0]]

            for ( var conn in emitters ) {
                var c = emitters[conn]

                if ( c === undefined ) continue;

                c.emit(pipe, data, cb)
            }
        }
    })

    
    d.listen( op.host, op.port || 5050 )

}

exports.connect = function ( op, cb) {

    if ( typeof op === 'number')
    {
        var port = op;
        op = {
            port: port
        }
    }

    op.port = op.port || 5050
    op.host = op.host || '127.0.0.1'
    

    var queue_enabled = false;
    var return_object = null;
  
    logger.info("Trying to connect to port [" + op.port + "]" )
   
    var connecting_interval = setInterval(function () {
        logger.info("Connecting...")
    }, 5000);

    if ( cb === undefined )
    {

        logger.info("Queueing enabled")

        queue_enabled = true;
        
        var publish_queue   = [];
        var subscribe_queue = [];

        return_object = {
            publish   : function () {
                publish_queue.push(arguments)
            }
        ,   subscribe : function () {
                subscribe_queue.push(arguments)
            }
        ,   connected: false
        }

    }

    DNode.connect(op.host, op.port, function (remote) { 

        clearInterval(connecting_interval)
        logger.info("Connected")

        var subscriptions = {}

        function subscribe(topic, pipe, fn)
        {
            logger.info("Subscribe topic [" + topic + "] pipe [" + pipe + "]")
            var em = null

            if ( subscriptions[topic] === undefined )
            {
                em = subscriptions[topic] = new EventEmitter 
                
                var emit = em.emit.bind(em); 
                remote.subscribe(topic, emit); 
            } else em = subscriptions[topic]    

            em.on(pipe, function (data, cb) {
                fn(topic, pipe, data, cb)
            }); 
        }

        function publish (topic, pipe, data, cb)
        {
            logger.info("Publish topic [" + topic + "] pipe [" + pipe + "]")
            remote.publish(topic, pipe, data, cb)
        }

        if ( queue_enabled == true )
        {
            return_object.publish   = publish
            return_object.subscribe = subscribe 
            return_object.connected = true

            while (subscribe_queue.length)
                subscribe.apply(subscribe, subscribe_queue.shift())
                
            while (publish_queue.length)
                publish.apply(publish, publish_queue.shift())

            return;
        }

        cb({
            publish   : publish
        ,   subscribe : subscribe
        });


    });

    return return_object
}
