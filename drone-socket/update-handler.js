var constants = require('./constants')
var redis = require('redis')
var redisClient = redis.createClient(constants.redisPort, constants.redisHost)
var Validator = require('jsonschema').Validator

redisClient.on('error', function (err) {
  console.log('Redis Client Error :' + err)
})

// The schema to validate incoming JSON objects
var messageSchema = {
  id: '/droneMessage',
  type: 'object',
  properties: {
    ID: { type: 'string' },
    lat: { format: 'isNumber' },
    lon: { format: 'isNumber' },
    timestamp: { format: 'isNumber' },
    sim: { type: 'boolean' },
    paused: { type: 'boolean' }
  },
  required: ['ID', 'lat', 'lon', 'timestamp']
}

Validator.prototype.customFormats.isNumber = function (input) {
  return !isNaN(input)
}

// A function that takes in a JSON object representing a drone location in the form:
// {
//     ID: "Unique ID Here",
//     lat: 123,
//     lon: 456,
//     timestamp: 123123123, // Unix timestamp
//     sim: true, //defines whether the object was created by the simulator or a real drone, can be emitted
//     paused: false //only used for simulated drones, can be emitted
// }
// Saves the object in redis with the key being set as the ID.
// If their is a previous value for the same key, it is replaced, and the speed
// is calculated based on the difference between the two.
function newMessage (data) {
  var validator = new Validator()
  var vaildationResult = validator.validate(data, messageSchema)
  if (vaildationResult.valid) {
    getExistingRedisValue(data, previousValue => {
      var speed = calculateSpeedKmPerHour(previousValue, data)
      data.speed = speed
      setNewRedisValue(data)
    })
  } else console.log(vaildationResult.errors)
}

// Adds data object to redis, with key set to data.ID, and publishes the update via redis
function setNewRedisValue (data) {
  var newValue = JSON.stringify(data)
  redisClient.set(data.ID, newValue, (err, reply) => {
    if (err) console.log('Error setting redis value: ' + err)
    else {
      redisClient.publish(
        constants.locationUpdateChannel,
        JSON.stringify(data)
      )
    }
  })
}

// Retrievs any existing value of data.ID in redis, parses the result and passes it to callback.
function getExistingRedisValue (data, callback) {
  redisClient.get(data.ID, (err, reply) => {
    if (err) {
      console.log('Error getting redis value: ' + err)
    } else {
      var result = JSON.parse(reply)
      callback(result)
    }
  })
}

// Calculates the the speed of a drone based on two location updates
function calculateSpeedKmPerHour (previousValue, currentValue) {
  if (previousValue) {
    var distance = getDistanceFromLatLonInKm(
      previousValue.lat,
      previousValue.lon,
      currentValue.lat,
      currentValue.lon
    )
    var time = getTimeDifferenceInHoursFromMs(
      previousValue.timestamp,
      currentValue.timestamp
    )
    return distance / time
  } else {
    return null
  }
}

// Get time difference in hours between two unix timestamps
function getTimeDifferenceInHoursFromMs (previousValueMs, currentValueMs) {
  var difference = currentValueMs - previousValueMs
  // dont return negative values
  if (difference <= 0) return null

  return difference / constants.msPerHour
}

// Calculate distance in km along the earths surface, between two sets of coordinates.
// Assumes the earth is spherical.
function getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
  var R = constants.radiousOfEarthInKM
  var dLat = deg2rad(lat2 - lat1)
  var dLon = deg2rad(lon2 - lon1)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = R * c // Distance in km
  return d
}

// Convert degrees to radians
function deg2rad (deg) {
  return deg * (Math.PI / 180)
}

exports.newMessage = newMessage
