var uuidv4 = require('uuid/v4')
var constants = require('./constants')
var redisClient = require('redis').createClient(
  constants.redisPort,
  constants.redisHost
)

// Create a drone object, and sends it to the drone-socket application using the provided socket.io socket
function createDrone (socket) {
  var drone = {
    ID: uuidv4(),
    lat: randomLatitude(),
    lon: randomLongitude(),
    timestamp: Date.now(),
    sim: true,
    paused: false
  }
  socket.emit(constants.droneLocationUpdateMessage, drone)
}

// Attemps to find a drone object stored in redis with an ID that matches the provided string.
// If found, it sets the paused flag to true, then updates the drone in redis, and publishes a notification
// via redis.
function pauseDrone (droneID) {
  redisClient.get(droneID, (err, reply) => {
    if (err) console.log(err)

    if (reply) {
      var drone = JSON.parse(reply)
      // Only allow pausing if simulated
      if (drone.sim) {
        drone.paused = true
        redisClient.set(drone.ID, JSON.stringify(drone), (err, reply) => {
          if (!err) {
            redisClient.publish(
              constants.dronePausedNotificationMessage,
              drone.ID
            )
          }
        })
      }
    }
  })
}

// Attemps to find a drone object stored in redis with an ID that matches the provided string.
// If found, it deletes the drone from redis and publishes a notification via redis.
function deleteDrone (droneID) {
  redisClient.get(droneID, (err, reply) => {
    if (err) console.log(err)

    if (reply) {
      var drone = JSON.parse(reply)
      // Only allow delete if simulated
      if (drone.sim) {
        redisClient.del(droneID, (err, reply) => {
          if (!err) {
            redisClient.publish(
              constants.droneDeletedNotificationMessage,
              drone.ID
            )
          }
        })
      }
    }
  })
}

// Attemps to find a drone object stored in redis with an ID that matches the provided string.
// If found, it sets the paused flag to false, then updates the drone in redis, and publishes a notification
// via redis.
function restartDrone (droneID) {
  redisClient.get(droneID, (err, reply) => {
    if (err) console.log(err)

    if (reply) {
      var drone = JSON.parse(reply)
      // Only allow restarting if simulated
      if (drone.sim) {
        drone.paused = false
        redisClient.set(drone.ID, JSON.stringify(drone), (err, reply) => {
          if (!err) {
            redisClient.publish(
              constants.droneRestartedNotificationMessage,
              drone.ID
            )
          }
        })
      }
    }
  })
}

// Attempts to retrieve all values in redis, then updates the location / timestamp of each drone
// and emits the updated value to the drone-socket application using the provided socket.io socket
function updateAllValues (socket) {
  // Get all keys from redis
  redisClient.keys('*', (err, reply) => {
    if (err) console.log(err)

    if (reply.length) {
      // Use keys to get all values from redis
      redisClient.mget(reply, (err, valueReply) => {
        if (err) console.log(err)

        var allDrones = valueReply.map(x => {
          return JSON.parse(x)
        })

        // Update each drone's location and timestamp and emit message via socket
        for (var i = 0; i < allDrones.length; i++) {
          var drone = allDrones[i]

          // Only update simulated drones which arent paused
          if (drone.sim && !drone.paused) {
            drone.lat = randomlyIncrementLatitude(drone.lat)
            drone.lon = randomlyIncrementLongitude(drone.lon)
            drone.timestamp = Date.now()
            socket.emit(constants.droneLocationUpdateMessage, drone)
          }
        }
      })
    }
  })
}

// Start a periodic task that attempts to update all simulated drones
function startSimulator (socket) {
  setInterval(() => {
    updateAllValues(socket)
  }, 2000)
}

// Return a random latitude i.e. a number in the range -90 : 90
function randomLatitude () {
  return randomNumberInRange(-90, 90).toFixed(2)
}

// Return a random longitude i.e. a number in the range -180 : 180
function randomLongitude () {
  return randomNumberInRange(-180, 180).toFixed(2)
}

// Randomly increase / decrease the provided number, but stay with the range -90 : 90
function randomlyIncrementLatitude (value) {
  return randomlyIncrementValueWithinRange(value, 90, -90)
}

// Randomly increase / decrease the provided number, but stay with the range -180 : 180
function randomlyIncrementLongitude (value) {
  return randomlyIncrementValueWithinRange(value, 180, -180)
}

// Randomly increment the prvovided number by a small factor, staying with the provided range
function randomlyIncrementValueWithinRange (value, max, min) {
  // Not that sophisticated, but will give some illusion of movement
  var factor = randomNumberInRange(0.99999, 1.00001)
  var result = value * factor
  if (result > max) result = result - (result - max) * 2
  if (result < -max) result = result + (result + max) * 2

  return result
}

// Return a random number in the provided range
function randomNumberInRange (min, max) {
  return Math.random() * (max - min) + min
}

exports.createDrone = createDrone
exports.startSimulator = startSimulator
exports.pauseDrone = pauseDrone
exports.restartDrone = restartDrone
exports.deleteDrone = deleteDrone
