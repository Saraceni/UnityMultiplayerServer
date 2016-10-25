var io = require('socket.io')(process.env.PORT || 3002);
var shortid = require('shortid');

var players = [];

console.log('server started');

io.on('connection', function(socket){

    console.log('player connected');

    var thisPlayerId = shortid.generate();

    var player = {
        id: thisPlayerId,
        x: 0,
        y: 0,
        rot: 0,
        walking: false
    }

    players[thisPlayerId] = player;
    
    socket.emit('register', {id: thisPlayerId});
    // envia para todos os outros players.
    socket.broadcast.emit('spawn', {id: thisPlayerId});

    // envia so para o player atual
    for(var playerId in players) {
        if(playerId == thisPlayerId) continue;
        socket.emit('spawn', players[playerId]);
    }

    socket.on('attack', function(data) {
        console.log('attack request: ', data);
        data.id = thisPlayerId;
        player = data;
        io.emit('attack', data);
    });

    socket.on('updatePosition', function(data){
        console.log('update position: ', data);
        data.id = thisPlayerId;
        player = data;
        socket.broadcast.emit('updatePosition', data);
    });

    socket.on('disconnect', function(){
        console.log('player disconnected');
        delete players[thisPlayerId];
        socket.broadcast.emit('disconnected', {id: thisPlayerId});
    });
});