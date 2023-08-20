const express = require('express');
app = express();
const cors = require('cors');
app.use(cors());
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
require('express-ws')(app);

const { readFileSync, existsSync, writeFileSync } = require('fs');
const { ensureDirSync } = require('fs-extra');
const randomString = require('random-string');

const ROOM_STATUS = {
    WATING: 1,
    PLAYING: 2,
    CLOSED: 3
};
const MAP_WIDTH = 10000, MAP_HEIGHT = 8000;
const PLAYER_R = 20;
function RandInt(l, r) {
    return Math.floor(Math.random() * (r - l + 1)) + l;
}

var Rooms = {}, Sockets = {};
ensureDirSync('db');
if (existsSync('db/room.json'))
    Rooms = JSON.parse(readFileSync('db/room.json', 'utf8'));
function saveRooms() {
    writeFileSync('db/room.json', JSON.stringify(Rooms));
}

app.all('*', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    if ('OPTIONS' == req.method) return res.send(200);
    next();
});
app.use('/asset', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile('assets/index.html', { root: __dirname });
});
app.post('/api/create', (req, res) => {
    if (req.body.length <= 0) return;
    var roomId = randomString({ length: 4 });
    Rooms[roomId] = {
        length: req.body.length,
        status: ROOM_STATUS.PLAYING,
        startAt: new Date().getTime(),
        player: [{
            x: RandInt(3000, 4000),
            y: RandInt(1000, 2000),
            d: { x: 0, y: 1 }, v: 0
        }],
    };
    saveRooms();
    res.json({ roomId: roomId });
});
app.get('/room/:roomId', (req, res) => {
    res.sendFile('assets/room.html', { root: __dirname });
});
app.post('/api/loadRoom', (req, res) => {
    var { roomId } = req.body;
    if (!Rooms[roomId]) res.json({ error: '房间不存在。' });
    if (Rooms[roomId].status == ROOM_STATUS.CLOSED) res.json({ error: '房间已关闭。' });
    // if(Rooms[roomId].status)
    res.json({
        startAt: Rooms[roomId].startAt,
        length: Rooms[roomId].length
    });
});

app.ws('/room/:roomId', (socket, req) => {
    var { roomId } = req.params;
    if (!roomId || !Rooms[roomId]) return;

    var socketId = randomString(32);
    Sockets[socketId] = { socket, roomId };

    socket.on('message', body => {
        try { body = JSON.parse(body); }
        catch (e) { }
        if (body.speed > 100) body.speed = 100;
        var hypot = Math.hypot(body.direction.x, body.direction.y);
        body.direction.x /= hypot, body.direction.y /= hypot;
        Rooms[roomId].player[0].d = body.direction;
        Rooms[roomId].player[0].v = body.speed;
    });

    socket.on('close', (e) => {
        // delete Sockets[socketId];
    });
});

setInterval(() => {
    for (var roomId in Rooms) {
        for (var i in Rooms[roomId].player) {
            var { d, v } = Rooms[roomId].player[i];
            var newx = Rooms[roomId].player[i].x + d.x * v * 0.1,
                newy = Rooms[roomId].player[i].y + d.y * v * 0.1;
            if (newx - PLAYER_R < 0) newx = PLAYER_R;
            if (newx + PLAYER_R > MAP_WIDTH) newx = MAP_WIDTH - PLAYER_R;
            if (newy - PLAYER_R < 0) newy = PLAYER_R;
            if (newy + PLAYER_R > MAP_HEIGHT) newy = MAP_WIDTH - PLAYER_R;
            Rooms[roomId].player[i].x = newx;
            Rooms[roomId].player[i].y = newy;
        }
    }
    saveRooms();
    for (var socketId in Sockets) {
        var cli = Sockets[socketId];
        cli.socket.send(JSON.stringify({
            now: Rooms[cli.roomId].player[0],
            player: Rooms[cli.roomId].player,
        }));
    }
}, 50);

app.listen(6876, () => {
    console.log('Port :6876 is opened');
});
