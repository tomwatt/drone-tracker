var expect = require('chai').expect
var sinon = require('sinon')
var rewire = require('rewire')
var constants = require('./constants')

describe('drone-web update handler', function () {
  it('broadcastAllValues attempts to emit an array of drones', function () {
    var existingDrones = [
      {
        ID: '123-456',
        lat: 45,
        lon: 120,
        timestamp: 123123123,
        sim: true,
        paused: false
      },
      {
        ID: 'some-key',
        lat: -10,
        lon: 20.333,
        timestamp: 123123123345,
        sim: true,
        paused: true
      }
    ]

    var existingRedisValues = existingDrones.map(x => {
      return JSON.stringify(x)
    })

    var redisClientMock = {
      keys: function (pattern, cb) {
        cb(null, ['some', 'keys'])
      },
      mget: function (reply, cb) {
        cb(null, existingRedisValues)
      }
    }

    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }

    var updateHandler = rewire('./update-handler.js')
    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.broadcastAllValues(socketMock)

    expect(socketMock.emit).to.be.calledWith(
      constants.allLocationBroadcastMessage,
      existingDrones
    )

    revertClient()
  })
  it('subscribeToUpdates tries to emit location update on correct message', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var droneMessage = JSON.stringify(drone)

    var subscriptionMock = {
      on: function (message, cb) {
        cb(constants.locationUpdateChannel, droneMessage)
      }
    }

    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }

    var updateHandler = rewire('./update-handler.js')
    var revert = updateHandler.__set__('subscription', subscriptionMock)

    updateHandler.subscribeToUpdates(socketMock)

    expect(socketMock.emit).to.be.calledWith(
      constants.webLocationUpdate,
      drone
    )

    revert()
  })
  it('subscribeToUpdates tries to emit paused notification on correct message', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var subscriptionMock = {
      on: function (message, cb) {
        cb(constants.dronePausedNotificationMessage, drone.ID)
      }
    }

    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }

    var updateHandler = rewire('./update-handler.js')
    var revert = updateHandler.__set__('subscription', subscriptionMock)

    updateHandler.subscribeToUpdates(socketMock)

    expect(socketMock.emit).to.be.calledWith(
      constants.dronePausedNotificationMessage,
      drone.ID
    )

    revert()
  })
  it('subscribeToUpdates tries to emit restarted notification on correct message', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var subscriptionMock = {
      on: function (message, cb) {
        cb(constants.droneRestartedNotificationMessage, drone.ID)
      }
    }

    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }

    var updateHandler = rewire('./update-handler.js')
    var revert = updateHandler.__set__('subscription', subscriptionMock)

    updateHandler.subscribeToUpdates(socketMock)

    expect(socketMock.emit).to.be.calledWith(
      constants.droneRestartedNotificationMessage,
      drone.ID
    )

    revert()
  })
  it('subscribeToUpdates tries to emit deleted notification on correct message', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var subscriptionMock = {
      on: function (message, cb) {
        cb(constants.droneDeletedNotificationMessage, drone.ID)
      }
    }

    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }

    var updateHandler = rewire('./update-handler.js')
    var revert = updateHandler.__set__('subscription', subscriptionMock)

    updateHandler.subscribeToUpdates(socketMock)

    expect(socketMock.emit).to.be.calledWith(
      constants.droneDeletedNotificationMessage,
      drone.ID
    )

    revert()
  })
})
