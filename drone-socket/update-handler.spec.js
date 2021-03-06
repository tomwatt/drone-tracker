var expect = require('chai').expect
var sinon = require('sinon')
var rewire = require('rewire')

describe('drone-socket update handler', function () {
  it('tries to get existing value from redis', function () {
    var message = {
      ID: '123-456',
      lat: 123,
      lon: 456,
      timestamp: 123123123
    }

    var updateHandler = rewire('./update-handler.js')

    var redisClientMock = {
      get: sinon.spy(function (key, cb) {}),
      set: sinon.spy(function (key, val, cb) {})
    }

    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.newMessage(message)

    expect(redisClientMock.get).to.be.calledWith(message.ID)

    revertClient()
  })

  it('tries to insert new value into redis', function () {
    var message = {
      ID: '123-456',
      lat: 123,
      lon: 456,
      timestamp: 123123123
    }

    var expectedValueInRedis = {
      ID: '123-456',
      lat: 123,
      lon: 456,
      timestamp: 123123123,
      speed: null
    }

    var updateHandler = rewire('./update-handler.js')

    var redisClientMock = {
      get: sinon.spy(function (key, cb) {
        cb(null, null)
      }),
      set: sinon.spy(function (key, val, cb) {})
    }

    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.newMessage(message)

    expect(redisClientMock.set).to.be.calledWith(
      message.ID,
      JSON.stringify(expectedValueInRedis)
    )

    revertClient()
  })

  it('sets speed if previous value', function () {
    var existingValue = {
      ID: '123-456',
      lat: 45,
      lon: 45,
      timestamp: 123123123
    }

    var newValue = {
      ID: '123-456',
      lat: 45.01,
      lon: 45.01,
      timestamp: 123123124
    }

    var existingValueInRedis = JSON.stringify(existingValue)

    var updateHandler = rewire('./update-handler.js')

    var redisClientMock = {
      get: sinon.spy(function (key, cb) {
        cb(null, existingValueInRedis)
      }),
      set: sinon.spy(function (key, val, cb) {})
    }

    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.newMessage(newValue)

    expect(redisClientMock.set).to.be.calledWith(existingValue.ID)

    expect(JSON.parse(redisClientMock.set.args[0][1]).speed).is.not.null

    revertClient()
  })

  it('sets speed to null if no previous value', function () {
    var message = {
      ID: '123-456',
      lat: 123,
      lon: 456,
      timestamp: 123123123
    }

    var expectedValueInRedis = {
      ID: '123-456',
      lat: 123,
      lon: 456,
      timestamp: 123123123,
      speed: null
    }

    var updateHandler = rewire('./update-handler.js')

    var redisClientMock = {
      get: sinon.spy(function (key, cb) {
        cb(null, null)
      }),
      set: sinon.spy(function (key, val, cb) {})
    }

    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.newMessage(message)

    expect(redisClientMock.set).to.be.calledWith(
      message.ID,
      JSON.stringify(expectedValueInRedis)
    )

    revertClient()
  })

  it('does not try to insert value if invalid data sent', function () {
    var message = {
      rubbish: 'nonsense'
    }

    var updateHandler = rewire('./update-handler.js')

    var redisClientMock = {
      get: sinon.spy(function (key, cb) {
        cb(null, null)
      }),
      set: sinon.spy(function (key, val, cb) {})
    }

    var revertClient = updateHandler.__set__('redisClient', redisClientMock)

    updateHandler.newMessage(message)

    expect(redisClientMock.set).to.not.be.called

    revertClient()
  })
})
