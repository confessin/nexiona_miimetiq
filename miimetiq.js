#!/usr/bin/env node

// Declare Constants
var MODEL = "6-diesel_generator_schema";
var INSTANCE_NAME = "test_dg";
var HOST = "api.miimetiq.com";
var USERNAME = MODEL + "/" + INSTANCE_NAME;
var PASSWORD = "anypass"
var DEVICE_ID = "56090580e7e466125aa1c0a5"
var INSTRUMENT = "generator"
var WRITER = "power"
var TYPE = "boolean"

var amqp = require("amqplib");

// Declare routing key
var bindingKey = "miimetiq.ds.writer." + TYPE + "." + MODEL + "." + DEVICE_ID + "." + INSTRUMENT + "." + WRITER;
// URL should be in the format of
// amqp://user:pass@host:port/vhost
// FIXME: Since no port is given, hope this should suffice
var url = "amqp://" + USERNAME + ":" + PASSWORD + "@" + HOST;
// temp
// var url = "amqp://localhost";

// 1. Make a connection
amqp.connect(url).then(function(conn) {
  process.once('SIGINT', function() { conn.close(); });
  // 2. Create a channel
  return conn.createChannel().then(function(ch) {
    var ok = ch.assertQueue('', {durable: false});
    // 3. create a base queue
    ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
        // 4. bind the base queue to miimetiq exchange with the routing key.
        ch.bindQueue(q.queue, 'miimetiq', bindingKey);
        // 5. Start consuming
        ch.consume(q.queue, function(msg) {
            // Declare message receive callback.
            // This here is the callback
            console.log(" [x] %s", msg.content.toString());
            // get the unique request_id/task_id for the RPC
            var task_id = msg.properties.correlationId;
            // task queue publish payload.
            var answer_msg = {
                "status": "SUCCESS",
                "result": {"status": "OK"},
                "task_id": task_id
            };
            // Create a new queue with autodelete in 60 secs
            ch.assertQueue(task_id.replace('-', ''),
                    {durable: true, autoDelete:true, expires: 60 * 1000});
            // bind to that 60 second queue to celery results.
            ch.bindQueue(task_id.replace('-', ''), "celeryresults",
                    task_id.replace('-', ''));
            // Publish the answer_msg payload to celery_results.
            ch.publish("celeryresults", task_id.replace('-', ''), answer_msg,
                {"contentType": "application/json"})
        }, {noAck: true});
    console.log(ok)
    ok = ok.then(function(_qok) {
      return ch.consume('', function(msg) {
        console.log(" [x] Received '%s'", msg.content.toString());
      }, {noAck: true});
    });

    return ok.then(function(_consumeOk) {
      console.log(' [*] Waiting for messages. To exit press CTRL+C');
    });
  });
}).catch(console.warn);
})
