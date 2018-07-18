var expect = require('chai').expect
var sinon = require('sinon')
var rewire = require('rewire')
var simulator = require('./simulator')
var constants = require('./constants')

describe('drone-simulator simulator', function () {
  it('createDrone tries to send new drone via socket', function () {
    var socketMock = {
        emit: sinon.spy(function (message, drone) {}),        
      }
    simulator.createDrone(socketMock)
    expect(socketMock.emit).to.be.calledWith(constants.droneLocationUpdateMessage)
  })

  it('startSimulator tries to send update with existing drones', function () {

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

    var existingRedisValues = existingDrones.map((x) => {
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
        emit: sinon.spy(function (message, drone) {}),        
      }

    var simulator = rewire('./simulator.js')

    var revertClient = simulator.__set__('redisClient', redisClientMock)
    
    simulator.startSimulator(socketMock)

    // Simulator is a periodic task, so wait some time before testing
    setInterval(() => {
        expect(socketMock.emit).to.be.calledWith(constants.droneLocationUpdateMessage)
        expect(socketMock.emit).to.be.calledTwice
        expect(socketMock.emit[0][1].ID).to.equal(existingDrones[0].ID)
        expect(socketMock.emit[0][2].ID).to.equal(existingDrones[1].ID)
    }, 4000)

    revertClient();
  })
  it('pauseDrone tries to send update with paused set to true', function () {})
  it('restartDrone tries to send update with paused set to false', function () {})
  it('deleteDrone tries to delete drone from redis', function () {})
})
