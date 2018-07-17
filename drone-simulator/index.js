var server = require('http').createServer()
var io = require('socket.io')(server)
var ioClient = require('socket.io-client')
var simulator = require('./simulator')

var socketUrl = 'http://drone-socket:3000'
var simulatorSocket = ioClient(socketUrl)
simulator.startSimulator(simulatorSocket)

server.listen(3030)

io.on('connection', function (socket) {
  socket.on('create-drone-simulator', data => {})

  socket.on('pause-drone', data => {})

  socket.on('restart-drone', data => {})

  socket.on('delete-drone', data => {})
})
