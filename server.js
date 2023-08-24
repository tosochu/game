const express = require('express');
app = express();
const cors = require('cors');
app.use(cors());
const path = require('path');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('cookie-parser')())
require('express-ws')(app);

const { readFileSync, existsSync, writeFileSync } = require('fs');
const { ensureDirSync } = require('fs-extra');
const randomString = require('random-string');
const hashPassword = require('./lib/hash.js');

const ROOM_STATUS = {
    WATING: 1,
    PLAYING: 2,
    CLOSED: 3,
};
const PLAYER_STATUS = {
    FREE: 1,
    INROOM: 2,
};
const MAP_WIDTH = 10000, MAP_HEIGHT = 8000;
const PLAYER_R = 20, BLOCK_LENGTH = 200;
const VIEW_R = 500;
function RandInt(l, r) {
    return Math.floor(Math.random() * (r - l + 1)) + l;
}

var Users = {}, Rooms = {}, Sockets = {};
ensureDirSync('db');
if (existsSync('db/user.json'))
    Users = JSON.parse(readFileSync('db/user.json', 'utf8'));
if (existsSync('db/room.json'))
    Rooms = JSON.parse(readFileSync('db/room.json', 'utf8'));
function saveUsers() {
    writeFileSync('db/user.json', JSON.stringify(Users));
}
function saveRooms() {
    writeFileSync('db/room.json', JSON.stringify(Rooms));
}

app.all('*', (req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    if ('OPTIONS' == req.method) return res.send(200);
    if (req.cookies['tosochu/game/name'] && req.cookies['tosochu/game/cookie']
        && Users[req.cookies['tosochu/game/name']]
        && Users[req.cookies['tosochu/game/name']].cookie == req.cookies['tosochu/game/cookie'])
        req.user = req.cookies['tosochu/game/name'];
    else res.cookie('tosochu/game/name', ''),
        res.cookie('tosochu/game/cookie', '');
    next();
});
app.use('/asset', express.static(path.join(__dirname, 'assets')));

function RegisterPageHandler(pathname, filename) {
    app.get(pathname, (req, res) => {
        res.sendFile(`assets/html/${filename}`, { root: __dirname });
    });
}
RegisterPageHandler('/login', 'user_login.html');
RegisterPageHandler('/register', 'user_register.html');
RegisterPageHandler('/', 'room_create.html');
RegisterPageHandler('/room/:roomId', 'room_play.html');

app.post('/api/user/register', (req, res) => {
    var { username, password } = req.body;
    if (!username || !password) return;
    if (Users[username]) return res.json({ error: '用户名重复。' });
    if (!(/^[a-zA-Z0-9_]{4,16}/.test(username)))
        return res.json({ error: '用户名不合法。' });
    if (!(/^.{6,256}/.test(password)))
        return res.json({ error: '密码太菜，容易被盗。' });
    var salt = randomString({ length: 64 });
    Users[username] = {
        username, salt,
        hash: hashPassword(password, salt),
        status: PLAYER_STATUS.FREE,
        room: '',
    };
    saveUsers();
    res.json({});
});
app.post('/api/user/login', (req, res) => {
    var { username, password } = req.body;
    if (!username || !password) return;
    if (!Users[username]) return res.json({ error: '用户不存在。' });
    var { salt, hash } = Users[username];
    if (hashPassword(password, salt) != hash)
        return res.json({ error: '密码错误。' });
    var cookie = randomString({ length: 64 });
    Users[username].cookie = cookie; saveUsers();
    res.cookie('tosochu/game/name', username);
    res.cookie('tosochu/game/cookie', cookie);
    res.json({});
});
app.post('/api/room/create', (req, res) => {
    if (req.body.length <= 0) return;
    var roomId = randomString({ length: 4 });
    var items = new Array();
    const HEAVY_RATE = 0.6;
    const LIGHT_RATE = 0.04;
    for (var x = BLOCK_LENGTH; x <= (Math.min(MAP_HEIGHT, MAP_WIDTH) - 6 * BLOCK_LENGTH) / 2; x += BLOCK_LENGTH) {
        for (var y = x; y < MAP_HEIGHT - x; y += BLOCK_LENGTH) {
            if (y != x && y != MAP_HEIGHT - x - BLOCK_LENGTH && Math.random() < LIGHT_RATE)
                items.push({ type: 'line', S: { x, y }, T: { x: x + BLOCK_LENGTH, y } });
            if (Math.random() < HEAVY_RATE)
                items.push({ type: 'line', S: { x, y }, T: { x, y: y + BLOCK_LENGTH } });
        }
        for (var y = x; y < MAP_HEIGHT - x; y += BLOCK_LENGTH) {
            if (y != x && y != MAP_HEIGHT - x - BLOCK_LENGTH && Math.random() < LIGHT_RATE)
                items.push({ type: 'line', S: { x: MAP_WIDTH - x, y }, T: { x: MAP_WIDTH - x + BLOCK_LENGTH, y } });
            if (Math.random() < HEAVY_RATE)
                items.push({ type: 'line', S: { x: MAP_WIDTH - x, y }, T: { x: MAP_WIDTH - x, y: y + BLOCK_LENGTH } });
        }
    }
    for (var y = BLOCK_LENGTH; y <= (Math.min(MAP_HEIGHT, MAP_WIDTH) - 6 * BLOCK_LENGTH) / 2; y += BLOCK_LENGTH) {
        for (var x = y; x < MAP_WIDTH - y; x += BLOCK_LENGTH) {
            if (x != y && x != MAP_WIDTH - y - BLOCK_LENGTH && Math.random() < LIGHT_RATE)
                items.push({ type: 'line', S: { x, y }, T: { x, y: y + BLOCK_LENGTH } });
            if (Math.random() < HEAVY_RATE)
                items.push({ type: 'line', S: { x, y }, T: { x: x + BLOCK_LENGTH, y } });
        }
        for (var x = y; x < MAP_WIDTH - y; x += BLOCK_LENGTH) {
            if (x != y && x != MAP_WIDTH - y - BLOCK_LENGTH && Math.random() < LIGHT_RATE)
                items.push({ type: 'line', S: { x, y: MAP_HEIGHT - y }, T: { x, y: MAP_HEIGHT - y - BLOCK_LENGTH } });
            if (Math.random() < HEAVY_RATE)
                items.push({ type: 'line', S: { x, y: MAP_HEIGHT - y }, T: { x: x + BLOCK_LENGTH, y: MAP_HEIGHT - y } });
        }
    }
    for (var i = RandInt(10, 20); i > 0; i--)
        items.push({
            type: 'web', r: RandInt(50, 200),
            x: RandInt(0, MAP_WIDTH), y: RandInt(0, MAP_HEIGHT),
        });
    Rooms[roomId] = {
        length: req.body.length * 60,
        status: ROOM_STATUS.PLAYING,
        startAt: new Date().getTime(),
        player: {}, items,
    };
    Rooms[roomId].player[req.user] = {
        x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
        y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
        d: { x: 0, y: 1 }, v: 0,
    };
    saveRooms();
    res.json({ roomId: roomId });
});
app.post('/api/room/load', (req, res) => {
    if (!req.user) res.json({ error: '请先登录。' });
    var { roomId } = req.body;
    if (!Rooms[roomId]) res.json({ error: '房间不存在。' });
    if (Rooms[roomId].status == ROOM_STATUS.CLOSED) res.json({ error: '房间已关闭。' });
    if (!Rooms[roomId].player[req.user])
        Rooms[roomId].player[req.user] = {
            x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
            y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
            d: { x: 0, y: 1 }, v: 0,
        };
    res.json({
        startAt: Rooms[roomId].startAt,
        length: Rooms[roomId].length
    });
});

app.ws('/room/:roomId', (socket, req) => {
    if (!req.user) return socket.close();
    var { roomId } = req.params;
    if (!roomId || !Rooms[roomId]) return socket.close();
    if (!Rooms[roomId].player[req.user])
        Rooms[roomId].player[req.user] = {
            x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
            y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
            d: { x: 0, y: 1 }, v: 0,
        };

    var socketId = randomString(32);
    Sockets[socketId] = { socket, roomId, user: req.user };

    socket.on('message', body => {
        try { body = JSON.parse(body); }
        catch (e) { }
        if (body.speed > 120) body.speed = 120;
        var { x, y } = body.direction;
        if (Math.hypot(x, y) > 0)
            [x, y] = [x / Math.hypot(x, y), y / Math.hypot(x, y)];
        Rooms[roomId].player[req.user].d = { x, y };
        Rooms[roomId].player[req.user].v = body.speed;
    });

    socket.on('close', e => {
        delete Sockets[socketId];
    });
});

setInterval(() => {
    for (var roomId in Rooms) {
        for (var i in Rooms[roomId].player) {
            var { d, v } = Rooms[roomId].player[i];
            var { x, y } = Rooms[roomId].player[i];
            function checkCircleCrossRectangle({ x, y, r }, { x1, y1, x2, y2 }) {
                if (x1 > x2) [x1, x2] = [x2, x1];
                if (y1 > y2) [y1, y2] = [y2, y1];
                if (x1 <= x && x <= x2 && y1 <= y && y <= y2) return true;
                var closetX = 0, closetY = 0;
                if (x <= x1) closetX = x1;
                if (x >= x2) closetX = x2;
                if (x1 < x && x < x2) closetX = x;
                if (y <= y1) closetY = y1;
                if (y >= y2) closetY = y2;
                if (y1 < y && y < y2) closetY = y;
                return Math.hypot(x - closetX, y - closetY) <= r;
            }
            function checkCircleCrossCircle({ x, y, r }, { x1, y1, r1 }) {
                return Math.hypot(x - x1, y - y1) <= r + r1;
            }
            function checkCircleCrossItem(player, item, onlyPosition) {
                var flag = false;
                if (item.type == 'line') {
                    if (item.S.x == item.T.x)
                        flag = flag || checkCircleCrossRectangle(
                            player, { x1: item.S.x - 10, x2: item.S.x + 10, y1: item.S.y, y2: item.T.y },
                        );
                    if (item.S.y == item.T.y)
                        flag = flag || checkCircleCrossRectangle(
                            player, { x1: item.S.x, x2: item.T.x, y1: item.S.y - 10, y2: item.S.y + 10 },
                        );
                    flag = flag || checkCircleCrossCircle(
                        player, { x1: item.S.x, y1: item.S.y, r1: 10 },
                    );
                    flag = flag || checkCircleCrossCircle(
                        player, { x1: item.T.x, y1: item.T.y, r1: 10 },
                    );
                }
                if (item.type == 'web' && onlyPosition)
                    flag = flag || checkCircleCrossCircle(
                        player, { x1: item.x, y1: item.y, r1: item.r },
                    );
                return flag;
            }
            function checkAllCross(player) {
                var flag = false;
                flag = flag || checkCircleCrossRectangle(
                    player, { x1: -MAP_WIDTH, x2: MAP_WIDTH * 2, y1: -MAP_HEIGHT, y2: 0 },
                );
                flag = flag || checkCircleCrossRectangle(
                    player, { x1: -MAP_WIDTH, x2: MAP_WIDTH * 2, y1: MAP_HEIGHT, y2: MAP_HEIGHT * 2 },
                );
                flag = flag || checkCircleCrossRectangle(
                    player, { x1: -MAP_WIDTH, x2: 0, y1: -MAP_HEIGHT, y2: MAP_HEIGHT * 2 },
                );
                flag = flag || checkCircleCrossRectangle(
                    player, { x1: MAP_WIDTH, x2: MAP_WIDTH * 2, y1: -MAP_HEIGHT, y2: MAP_HEIGHT * 2 },
                );
                for (var item of Rooms[roomId].items) {
                    flag = flag || checkCircleCrossItem(player, item, false);
                    if (flag) break;
                }
                // return flag;
                for (var name in Rooms[roomId].player) {
                    if (name == i) continue;
                    var { x, y } = Rooms[roomId].player[name];
                    flag = flag || checkCircleCrossCircle(player, { x1: x, y1: y, r1: PLAYER_R });
                    if (flag) break;
                }
                return flag;
            }
            var maxv = 0.15;
            for (var item of Rooms[roomId].items)
                if (item.type == 'web' && checkCircleCrossItem({ x, y, r: PLAYER_R }, item, true)) maxv /= 5;
            const SmallStep = 3;
            var dis = 0;
            while (dis <= v * maxv) {
                dis += SmallStep;
                if (checkAllCross({ x: x + d.x * dis, y, r: PLAYER_R })) { dis -= SmallStep; break; }
            }
            if (dis > 0) Rooms[roomId].player[i].lastOp = new Date().getTime();
            x = Rooms[roomId].player[i].x = x + d.x * dis;
            dis = 0;
            while (dis <= v * maxv) {
                dis += SmallStep;
                if (checkAllCross({ x, y: y + d.y * dis, r: PLAYER_R })) { dis -= SmallStep; break; }
            }
            if (dis > 0) Rooms[roomId].player[i].lastOp = new Date().getTime();
            Rooms[roomId].player[i].y = y + d.y * dis;
        }
    }
    saveRooms();
    for (var socketId in Sockets) {
        var { roomId, socket, user } = Sockets[socketId];
        var items = new Array();
        for (var item of Rooms[roomId].items) {
            var player = Rooms[roomId].player[user]; player.r = VIEW_R;
            if (checkCircleCrossItem(player, item, true)) items.push(item);
        }
        socket.send(JSON.stringify({
            now: Rooms[roomId].player[user],
            player: Rooms[roomId].player,
            items,
        }));
    }
}, 100);

app.listen(6876, () => {
    console.log('Port :6876 is opened');
});
