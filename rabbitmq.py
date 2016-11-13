#!/usr/bin/env python
import pika
import json

MODEL = "6-diesel_generator_schema"
INSTANCE_NAME = "test_dg"
HOST = "api.miimetiq.com"
USERNAME = "{model}/{instance_name}".format(
        model=MODEL, instance_name=INSTANCE_NAME)
PASSWORD = "anypass"
DEVICE_ID = "56090580e7e466125aa1c0a5"
INSTRUMENT = "generator"
WRITER = "power"
TYPE = "boolean"

# 1. Make a connection
connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=HOST, credentials=pika.PlainCredentials(USERNAME, PASSWORD)
            ))
# 2. open a channel
channel = connection.channel()

# 3. create a base queue
result = channel.queue_declare()

# get the queue name
queue_name = result.method.queue

# Create a binding key for selectively loading messages
binding_key = ("miimetiq.ds.writer.{TYPE}.{MODEL}.{DEVICE_ID}."
        "{INSTRUMENT}.{WRITER}").format(**locals())

# 4. bind the base queue to miimetiq exchange with the routing key.
channel.queue_bind(exchange='miimetiq', queue=queue_name,
                   routing_key=binding_key)

print ' [*] Waiting for messages. To exit press CTRL+C'


# Declare message receive callback.
# I am guessing this is the handle which is given to user for doing something with that message,
def callback(ch, method, properties, body):
    print " [x] %r:%r" % (method.routing_key, body)
    # get the unique request_id/task_id for the RPC
    task_id = properties.correlation_id
    answer_msg = json.dumps({
        "status": "SUCCESS",
        "result": {"status": "OK"},
        "task_id": task_id
        })
    # Create a new queue with autodelete in 60 secs
    channel.queue_declare(
            queue=task_id.replace('-', ''), auto_delete=True,
            durable=True, arguments={"x-expires": 60 * 1000})
    # bind to that 60 second queue to celery results.
    channel.queue_bind(
            exchange='celeryresults',
            queue=task_id.replace('-', ''),
            routing_key=task_id.replace('-', ''))
    # Publish the answer_msg payload to celery_results.
    channel.basic_publish(
            exchange='celeryresults', routing_key=task_id.replace('-', ''),
            body=answer_msg,
            properties=pika.BasicProperties(content_type='application/json'))

# 5. Start consuming messages from base queue, specify a callback to call
# whenever a message is receievd
channel.basic_consume(callback, queue=queue_name, no_ack=True)
# Never ending loop
channel.start_consuming()
