var redis = require('redis').createClient('6379', 'redis')

describe('End to end tests of home page via selenium', function () {
  // Delete all values in redis. This package is only used from the docker-compose.e2e.test.yml
  // file. Never use in the production image.
  redis.flushdb()

  it('loads empty table', function (client) {
    client
      .url('http://drone-web/')
      .pause(2000)
      .expect.element('#tracking-table').to.be.present

    client.expect.element('.drone-row').to.not.be.present
  })

  it('clicking "Create Simulated Drone" creates a new drone', function (client) {
    client
      .url('http://drone-web/')
      .pause(2000)
      .element('#create-drone')
      .click()
      .pause(1000)
      .expect.element('.drone-row').to.be.present
  })

  it('clicking pause stops drone being updated', function (client) {
    client.url('http://drone-web/').pause(2000)

    client
      .element('.pause-drone')
      .click()
      .pause(1000)

    client.expect
      .element('.time-cell')
      .text.to.equal(client.pause(3000).element('.time-cell').text)
  })

  it('clicking restart starts drone being updated', function (client) {
    client.url('http://drone-web/').pause(2000)

    client
      .element('.restart-drone')
      .click()
      .pause(1000)

    client.expect
      .element('.time-cell')
      .text.to.not.equal(client.pause(3000).element('.time-cell').text)
  })

  it('clicking delete removes drone', function (client) {
    client.url('http://drone-web/').pause(2000)

    client
      .element('.delete-drone')
      .click()
      .pause(1000)
      .expect.element('.drone-row').to.not.be.present
  })
})
