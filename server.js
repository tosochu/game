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
const { ROOM_STATUS, PLAYER_STATUS } = require('./lib/status.js');
const {
    RandInt, VIEW_R, PLAYER_R,
    MAP_WIDTH, MAP_HEIGHT, BLOCK_LENGTH,
    checkCircleCrossCircle,
    checkCircleCrossItem,
    checkCircleCrossRectangle,
    generateRoom, generateHunters,
    getAllCanSee, planPath,
} = require('./lib/utils.js');

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
    Rooms[roomId] = generateRoom(req.body.length);
    Rooms[roomId].player[req.user] = {
        x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
        y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
        type: 'fugitive', d: { x: 0, y: 1 }, v: 0,
    };
    Rooms[roomId].player = Object.assign(Rooms[roomId].player,
        generateHunters(4, Rooms[roomId].items));
    saveRooms();
    res.json({ roomId: roomId });
});
app.post('/api/room/load', (req, res) => {
    if (!req.user) return res.json({ error: '请先登录。' });
    var { roomId } = req.body;
    if (!Rooms[roomId]) return res.json({ error: '房间不存在。' });
    if (Rooms[roomId].status == ROOM_STATUS.CLOSED) return res.json({ error: '房间已关闭。' });
    if (!Rooms[roomId].player[req.user])
        Rooms[roomId].player[req.user] = {
            x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
            y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
            type: 'fugitive', d: { x: 0, y: 1 }, v: 0,
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
            type: 'fugitive', d: { x: 0, y: 1 }, v: 0,
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

setInterval(async () => {
    var tasks = [];
    for (var roomId in Rooms) tasks.push((async () => {
        for (var i in Rooms[roomId].player) {
            if (Rooms[roomId].player[i].type != 'hunter') continue;
            var { x, y } = Rooms[roomId].player[i];
            Rooms[roomId].player[i] = Object.assign(Rooms[roomId].player[i],
                planPath(x, y, Rooms[roomId].player[i].data, getAllCanSee(Rooms[roomId], i)));
        }
    })());
    await Promise.all(tasks); tasks = [];
    for (var roomId in Rooms) tasks.push((async () => {
        for (var i in Rooms[roomId].player) {
            var gameOver = false;
            var { d, v, x, y } = Rooms[roomId].player[i];
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
                    if (name == i || Rooms[roomId].player[name].type != 'fugitive'
                        || Rooms[roomId].player[i].type != 'fugitive') continue;
                    var { x, y } = Rooms[roomId].player[name];
                    flag = flag || checkCircleCrossCircle(player, { x1: x, y1: y, r1: PLAYER_R });
                    if (flag) break;
                }
                return flag;
            }
            function checkGameOver(player) {
                for (var name in Rooms[roomId].player) {
                    if (name == i || Rooms[roomId].player[name].type
                        == Rooms[roomId].player[i].type) continue;
                    var { x, y } = Rooms[roomId].player[name];
                    gameOver = gameOver || checkCircleCrossCircle(player, { x1: x, y1: y, r1: PLAYER_R });
                    if (gameOver) break;
                }
            }
            var maxv = 0.15;
            for (var item of Rooms[roomId].items)
                if (item.type == 'web' && checkCircleCrossItem({ x, y, r: PLAYER_R }, item, true)) maxv /= 5;
            const SmallStep = 3;
            var dis = 0;
            while (dis <= v * maxv) {
                dis += SmallStep;
                if (checkAllCross({ x: x + d.x * dis, y, r: PLAYER_R })) { dis -= SmallStep; break; }
                checkGameOver({ x: x + d.x * dis, y, r: PLAYER_R });
            }
            if (dis > 0) Rooms[roomId].player[i].lastOp = new Date().getTime();
            x = Rooms[roomId].player[i].x = x + d.x * dis;
            dis = 0;
            while (dis <= v * maxv) {
                dis += SmallStep;
                if (checkAllCross({ x, y: y + d.y * dis, r: PLAYER_R })) { dis -= SmallStep; break; }
                checkGameOver({ x: x + d.x * dis, y, r: PLAYER_R });
            }
            if (dis > 0) Rooms[roomId].player[i].lastOp = new Date().getTime();
            Rooms[roomId].player[i].y = y + d.y * dis;
            if (gameOver && Rooms[roomId].player[i].type == 'fugitive') {
                // TODO: change status of player
                // delete Rooms[roomId].player[i];
                // for (var socketId in Sockets) {
                //     var { socket, user } = Sockets[socketId];
                //     if (user == i) {
                //         socket.send(JSON.stringify({ alert: '你死了' }));
                //         socket.close(); delete Sockets[socketId];
                //     }
                // }
            }
        }
    })());
    await Promise.all(tasks);
    saveRooms();
    for (var socketId in Sockets) {
        var { roomId, socket, user } = Sockets[socketId];
        socket.send(JSON.stringify(Object.assign({ now: Rooms[roomId].player[user] }, getAllCanSee(Rooms[roomId], user))));
    }
}, 100);

app.listen(6876, () => {
    console.log('Port :6876 is opened');
});
