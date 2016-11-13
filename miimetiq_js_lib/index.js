#!/usr/bin/env node

var amqp = require("amqplib");
var Promise = require('bluebird');
var chars = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': '\'',
  '&lt;': '<',
  '&gt;': '>'
};

var CONFIG = {
    "MODEL":  "6-diesel_generator_schema",
    "INSTANCE_NAME":  "test_dg",
    "HOST":  "api.miimetiq.com",
    "USERNAME":  "", // We change it on runtime.
    "PASSWORD":  "anypass",
    "DEVICE_ID":  "56090580e7e466125aa1c0a5",
    "INSTRUMENT":  "generator",
    "WRITER":  "power",
    "TYPE":  "boolean"
}

/**
 * Escape special characters in the given string of html.
 *
 * @param  {String} html
 * @return {String}
 */
module.exports = {
    setOptions: function(options) {
        if ( options == null || options == undefined) return null;
        for (var op in options) {
            CONFIG[op] = options[op];
        }
        return true;
    },
    // Use q (https://github.com/kriskowal/q) for promises? or plain old bluebird.
    startListening: function() {
        // Do everything and return a promise for attaching callback.
        // This should be super easy to implement by user but not as customizable.
        // USE changed config to create connections etc.
    },

    connect: function() {
    },
    bindByRoutingKey: function() {
    },
    startConsuming: function() {
    }
};
