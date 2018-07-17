var server = require('http').createServer()
var io = require('socket.io')(server)
var ioClient = require('socket.io-client')
var simulator = require('./simulator')
var constants = require('./constants')

// This is the client socket used by this application to communicate with
// the drone-socket application
var simulatorSocket = ioClient(constants.droneSocketUrl)

// This starts a pperiodic task, used to simulate movement for all simulated drones
simulator.startSimulator(simulatorSocket)

server.listen(constants.simulatorPort)

// This application listens for updates from clients (drone-web application),
// regarding the behaviour of simulated drones. The simulator then handles the change.
io.on('connection', function (socket) {
  socket.on('create-drone-simulator', data => {
    simulator.createDrone(simulatorSocket)
  })

  socket.on('pause-drone', data => {
    simulator.pauseDrone(data)
  })

  socket.on('restart-drone', data => {
    simulator.restartDrone(data)
  })

  socket.on('delete-drone', data => {
    simulator.deleteDrone(data)
  })
})
