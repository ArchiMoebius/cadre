const crypto = require('crypto');

const redis = require('redis');
const asyncLib = require('async');

const Database = require('./database.js');
const Messages = require('./messages.js');
const Config = require('./config.js');

const tokenExpiresInSeconds = 10 * 60;
const tokenRenewalIntervalInMilliseconds = Math.round(1000 * tokenExpiresInSeconds / 3);

module.exports.attach = function(scServer, socket) {
console.log("loadded message");
  socket.on('load_channel', async function(request, respond) {
    const redisClient = redis.createClient(Config.redis.options);
    let messages = [];
    respond();

    redisClient.lrange(request.channel, request.start, request.end, (err, reply) => {
      if (err) {
        console.log(err);// TODO: add logging
      } else {

        if (reply && reply.length > 0) {

          asyncLib.reduce(reply, [], function(messages, messageId, callback) {
              redisClient.hmget(messageId, "author", "message", "date", function(err, messageValues) {
                messages.push({
                  "author": messageValues[0],
                  "body": messageValues[1],
                  "date": messageValues[2]
                });

                callback(null, messages);
              });
          }, function(err, messages) {

              if(!err) {
                scServer.exchange.publish(
                  request.channel,
                  {
                    "type": "message",
                    "data": messages
                  }
                );
              } else {
                console.log(err);
              }
          });
        }
      }
    });
  });
};
