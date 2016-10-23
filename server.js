var io = require('socket.io')(process.env.PORT || 3002);
var shortid = require('shortid');

var players = [];
var playerSpeed = 3;

console.log('server started');

io.on('connection', function(socket){

    console.log('player connected');

    var thisPlayerId = shortid.generate();

    var player = {
        id: thisPlayerId,
        destination: { x: 0, y: 0 },
        lastPosition: { x: 0, y: 0 },
        lastMoveTime: 0
    }

    players[thisPlayerId] = player;
    
    socket.emit('register', {id: thisPlayerId});
    // envia para todos os outros players.
    socket.broadcast.emit('spawn', {id: thisPlayerId});
    socket.broadcast.emit('requestPosition');

    // envia so para o player atual
    for(var playerId in players) {
        if(playerId == thisPlayerId) continue;
        socket.emit('spawn', players[playerId]);
    }

    socket.on('follow', function(data){
        console.log('follow request: ', data);
        data.id = thisPlayerId;
        socket.broadcast.emit('follow', data);
    });

    socket.on('attack', function(data) {
        console.log('attack request: ', data);
        data.id = thisPlayerId;
        io.emit('attack', data);
    });

    socket.on('updatePosition', function(data){
        console.log('update position: ', data);
        data.id = thisPlayerId;
        socket.broadcast.emit('updatePosition', data);
    });

    socket.on('move', function(data){

        data.id = thisPlayerId;
        console.log('player moved', JSON.stringify(data));
        player.destination.x = data.d.x;
        player.destination.y = data.d.y;

        var elapsedTime = (Date.now() - player.lastMoveTime) / 1000;
        var travelDistanceLimit = elapsedTime * playerSpeed;
        var requestedDistanceTraveled = lineDistance(data.c, player.lastPosition);

        if(requestedDistanceTraveled > travelDistanceLimit) {
            // the player is cheating
        }

        player.lastMoveTime = Date.now();

        player.lastPosition = data.c;

        delete data.c

        data.x = data.d.x;
        data.y = data.d.y;

        delete data.d;

        socket.broadcast.emit('move', data);
    });

    socket.on('disconnect', function(){
        console.log('player disconnected');
        delete players[thisPlayerId];
        socket.broadcast.emit('disconnected', {id: thisPlayerId});
    });

    function lineDistance(vectorA, vectorB) {

        var xs = 0;
        var ys = 0;

        xs = vectorB.x - vectorA.x;
        xs = xs * xs;
        ys = vectorB.y - vectorA.y;
        ys = ys * ys;

        return Math.sqrt(xs + ys);
    }
});