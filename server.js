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

function getHomeHtml() {
    var homeHtml = readFileSync('index.html', 'utf8');
    return homeHtml;
}
app.get('/', (req, res) => {
    res.send(getHomeHtml());
});
app.post('/api/create', (req, res) => {
    var roomId = randomString({ length: 4 });
    Rooms[roomId] = {};
    saveRooms();
    writeFileSync(`room/${roomID}.html`, );
    res.json({ roomId: roomId });
});

app.listen(6876, () => {
    console.log('Port :6876 is opened');
});
