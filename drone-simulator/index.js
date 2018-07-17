var server = require('http').createServer()
var io = require('socket.io')(server)
var ioClient = require('socket.io-client')
var simulator = require('./simulator')
var constants = require('./constants')

var simulatorSocket = ioClient(constants.droneSocketUrl)
simulator.startSimulator(simulatorSocket)

server.listen(constants.simulatorPort)

io.on('connection', function (socket) {
  socket.on('create-drone-simulator', data => {})

  socket.on('pause-drone', data => {})

  socket.on('restart-drone', data => {})

  socket.on('delete-drone', data => {})
})
