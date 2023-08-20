const express = require('express');
app = express();
const cors = require('cors');
app.use(cors());
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const { readFileSync, existsSync, writeFileSync } = require('fs');
const { ensureDirSync } = require('fs-extra');
const randomString = require('random-string');

const ROOM_STATUS = {
    WATING: 1,
    PLAYING: 2,
    CLOSED: 3
};

Rooms = {};
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
        startAt: new Date().getTime()
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

app.listen(6876, () => {
    console.log('Port :6876 is opened');
});
