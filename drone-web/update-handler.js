var constants = require('./constants')
var redis = require('redis')
var redisClient = redis.createClient(constants.redisPort, constants.redisHost)
var subscription = redis.createClient(constants.redisPort, constants.redisHost)

// Subscribe to redis updates so we know whenever a drone gets updated in redis
subscription.subscribe(constants.locationUpdateChannel)
subscription.subscribe(constants.dronePausedNotificationMessage)
subscription.subscribe(constants.droneRestartedNotificationMessage)
subscription.subscribe(constants.droneDeletedNotificationMessage)

// Retrieve all values of drones in redis, and emit them via the provided socket.io io
// This is used by the UI to update all values, i.e. on page load
function broadcastAllValues (socket) {
  redisClient.keys('*', (err, reply) => {
    if (err) console.log(err)
    if (reply.length) {
      redisClient.mget(reply, (err, valueReply) => {
        if (err) console.log(err)
        if (valueReply.length) {
          var allDrones = valueReply.map(x => {
            return JSON.parse(x)
          })
          socket.emit(constants.allLocationBroadcastMessage, allDrones)
        }
      })
    }
  })
}

// When drones are updated in redis, this allows the UI of every user to update simultaneously
// Any updates published via redis are emitted via the provided socket.io socket
function subsribeToUpdates (socket) {
  subscription.on('message', (channel, message) => {
    if (channel === constants.locationUpdateChannel) {
      socket.emit(constants.webLocationUpdate, JSON.parse(message))
    } else if (channel === constants.dronePausedNotificationMessage) {
      socket.emit(constants.dronePausedNotificationMessage, message)
    } else if (channel === constants.droneRestartedNotificationMessage) {
      socket.emit(constants.droneRestartedNotificationMessage, message)
    } else if (channel === constants.droneDeletedNotificationMessage) {
      socket.emit(constants.droneDeletedNotificationMessage, message)
    }
  })
}

exports.broadcastAllValues = broadcastAllValues
exports.subsribeToUpdates = subsribeToUpdates
