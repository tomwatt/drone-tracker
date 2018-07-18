var expect = require('chai').expect
var sinon = require('sinon')
var rewire = require('rewire')
var simulator = require('./simulator')
var constants = require('./constants')

describe('drone-simulator simulator', function () {
  it('createDrone tries to send new drone via socket', function () {
    var socketMock = {
      emit: sinon.spy(function (message, drone) {})
    }
    simulator.createDrone(socketMock)
    expect(socketMock.emit).to.be.calledWith(
      constants.droneLocationUpdateMessage
    )
  })

  it('startSimulator tries to send update with existing drones', function () {
    this.clock = sinon.useFakeTimers()

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

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.startSimulator(socketMock)

    // startSimulator is a periodic task
    this.clock.tick(4000)

    var existingDroneIds = [existingDrones[0].ID, existingDrones[1].ID]

    expect(socketMock.emit).to.be.calledWith(
      constants.droneLocationUpdateMessage
    )
    expect(socketMock.emit).to.be.calledTwice
    expect(existingDroneIds).to.include(socketMock.emit.args[0][1].ID)
    expect(existingDroneIds).to.include(socketMock.emit.args[1][1].ID)

    revertClient()
    this.clock.restore()
  })

  it('startSimulator only updates simulated drones', function () {
    this.clock = sinon.useFakeTimers()
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
        sim: false,
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

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.startSimulator(socketMock)

    // startSimulator is a periodic task
    this.clock.tick(5000)

    expect(socketMock.emit).to.be.calledWith(
      constants.droneLocationUpdateMessage
    )

    // Emit should be called with the ID of the simulated drone
    expect(socketMock.emit.args[0][1].ID).to.equal(existingDrones[0].ID)
    // Check first two calls to emit - neither should be called with the ID of
    // the non-simulated drone. Cant use not.calledWith, since the argument is
    // actually the whole drone object, and I dont know what the lat / lon will be.
    expect(socketMock.emit.args[0][1].ID).to.not.equal(existingDrones[1].ID)
    expect(socketMock.emit.args[1][1].ID).to.not.equal(existingDrones[1].ID)

    revertClient()
    this.clock.restore()
  })

  it('startSimulator doesnt update existing drones that are paused', function () {
    this.clock = sinon.useFakeTimers()
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

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.startSimulator(socketMock)
    this.clock.tick(5000)

    expect(socketMock.emit).to.be.calledWith(
      constants.droneLocationUpdateMessage
    )
    // Emit should be called with the ID of the non-paused drone
    expect(socketMock.emit.args[0][1].ID).to.equal(existingDrones[0].ID)
    // Check first two calls to emit - neither should be called with the ID of
    // the paused drone. Cant use not.calledWith, since the argument is
    // actually the whole drone object, and I dont know what the lat / lon will be.
    expect(socketMock.emit.args[0][1].ID).to.not.equal(existingDrones[1].ID)
    expect(socketMock.emit.args[1][1].ID).to.not.equal(existingDrones[1].ID)

    this.clock.restore()
    revertClient()
  })

  it('pauseDrone tries to send update with paused set to true', function () {
    var runningDrone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: false
    }
    var pausedDrone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: true
    }

    var redisValue = JSON.stringify(runningDrone)
    var expectedRedisValue = JSON.stringify(pausedDrone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: sinon.spy(function (key, val, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.pauseDrone(runningDrone.ID)

    expect(redisClientMock.set).to.be.calledWith(
      runningDrone.ID,
      expectedRedisValue
    )

    revertClient()
  })

  it('pauseDrone only allows updating of simulated drones', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: sinon.spy(function (key, val, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.pauseDrone(drone.ID)

    expect(redisClientMock.set).to.not.be.called

    revertClient()
  })

  it('pauseDrone tries to publish notification via redis is successful', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: false
    }

    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: function (key, val, cb) {
        cb(null, null)
      },
      publish: sinon.spy(function (channel, message) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.pauseDrone(drone.ID)

    expect(redisClientMock.publish).to.be.calledWith(
      constants.dronePausedNotificationMessage,
      drone.ID
    )

    revertClient()
  })

  it('restartDrone tries to send update with paused set to false', function () {
    var pausedDrone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: true
    }
    var restartedDrone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: false
    }

    var redisValue = JSON.stringify(pausedDrone)
    var expectedRedisValue = JSON.stringify(restartedDrone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: sinon.spy(function (key, val, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.restartDrone(pausedDrone.ID)

    expect(redisClientMock.set).to.be.calledWith(
      pausedDrone.ID,
      expectedRedisValue
    )

    revertClient()
  })

  it('restartDrone only allows updating of simulated drones', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false
    }

    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: sinon.spy(function (key, val, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.restartDrone(drone.ID)

    expect(redisClientMock.set).to.not.be.called

    revertClient()
  })

  it('restartDrone tries to publish notification via redis is successful', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: true
    }

    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      set: function (key, val, cb) {
        cb(null, null)
      },
      publish: sinon.spy(function (channel, message) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.restartDrone(drone.ID)

    expect(redisClientMock.publish).to.be.calledWith(
      constants.droneRestartedNotificationMessage,
      drone.ID
    )

    revertClient()
  })

  it('deleteDrone tries to delete drone from redis', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: true
    }
    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      del: sinon.spy(function (key, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.deleteDrone(drone.ID)

    expect(redisClientMock.del).to.be.calledWith(drone.ID)
    expect(redisClientMock.del).to.be.calledOnce
    revertClient()
  })

  it('deleteDrone only tries to delete simulated drones', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: false,
      paused: true
    }
    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      del: sinon.spy(function (key, cb) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.deleteDrone(drone.ID)

    expect(redisClientMock.del).to.not.be.called
    revertClient()
  })

  it('deleteDrone tries to publish notification via redis is successful', function () {
    var drone = {
      ID: '123-456',
      lat: 45,
      lon: 120,
      timestamp: 123123123,
      sim: true,
      paused: true
    }

    var redisValue = JSON.stringify(drone)

    var redisClientMock = {
      get: function (key, cb) {
        cb(null, redisValue)
      },
      del: function (key, cb) {
        cb(null, null)
      },
      publish: sinon.spy(function (channel, message) {})
    }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)

    simulator.deleteDrone(drone.ID)

    expect(redisClientMock.publish).to.be.calledWith(
      constants.droneDeletedNotificationMessage,
      drone.ID
    )

    revertClient()
  })
})
