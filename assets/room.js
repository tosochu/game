const GAME_STAGE = {
  LOADING_ROOM: 1,
  WAITING_START: 2,
  PLAYING: 3
};
const VIEW_R = 500;
const BlockLength = 200;

async function loadRoom(roomId) {
  var response = await fetch("/api/loadRoom", {
    "headers": { "content-type": "application/json" },
    "body": JSON.stringify({ roomId }),
    "method": "POST",
  });
  var room = await response.json();
  if (room.error) {
    alert(room.error);
    window.location.pathname = '';
  }
  window.gameStartTime = room.startAt;
  window.gameLength = room.length;
  window.gameStage = GAME_STAGE.PLAYING;
}

$(window).resize(initWindow);

function DrawArrow() {
  var x = window.mouse.x - windowWidth() / 2,
    y = window.mouse.y - windowHeight() / 2;
  if (Math.hypot(x, y) <= 50) return;
  var d = ArcSine(x, y);
  var greyness = 330 - Math.min(Math.hypot(x, y), 100) * 1.5;
  setColor(`rgb(${greyness},${greyness},${greyness})`, 'transparent');
  drawLine(
    windowWidth() / 2,
    windowHeight() / 2,
    window.mouse.x,
    window.mouse.y,
    'round',
    12,
  );
  drawLine(
    window.mouse.x - Math.cos(d - Math.PI / 4) * 30,
    window.mouse.y - Math.sin(d - Math.PI / 4) * 30,
    window.mouse.x,
    window.mouse.y,
    'round',
    12,
  );
  drawLine(
    window.mouse.x - Math.cos(d + Math.PI / 4) * 30,
    window.mouse.y - Math.sin(d + Math.PI / 4) * 30,
    window.mouse.x,
    window.mouse.y,
    'round',
    12,
  );
}

function DrawBackground() {
  setColor('transparent', '#aaa');
  for (var x = 0; x <= MAP_WIDTH; x += BlockLength)
    drawRectangle(
      windowWidth() / 2 + x - window.now.x,
      windowHeight() / 2 - window.now.y,
      1,
      MAP_HEIGHT,
    );
  for (var y = 0; y <= MAP_HEIGHT; y += BlockLength)
    drawRectangle(
      windowWidth() / 2 - window.now.x,
      windowHeight() / 2 + y - window.now.y,
      MAP_WIDTH,
      1,
    );
  for (var x = 0; x < MAP_WIDTH; x += BlockLength)
    for (var y = 0; y < MAP_HEIGHT; y += BlockLength) {
      drawCenterText(
        windowWidth() / 2 + x - window.now.x + BlockLength / 2,
        windowHeight() / 2 + y - window.now.y + BlockLength / 2 + 20 / 2,
        '20px Consolas',
        `${x / 200},${y / 200}`
      );
    }
  setColor('transparent', 'rgb(77,38,0)');
  drawRectangle(
    windowWidth() / 2 - MAP_WIDTH - window.now.x,
    windowHeight() / 2 - MAP_HEIGHT - window.now.y,
    MAP_WIDTH,
    MAP_HEIGHT * 3,
  );
  drawRectangle(
    windowWidth() / 2 + MAP_WIDTH - window.now.x,
    windowHeight() / 2 - MAP_HEIGHT - window.now.y,
    MAP_WIDTH,
    MAP_HEIGHT * 3,
  );
  drawRectangle(
    windowWidth() / 2 - MAP_WIDTH - window.now.x,
    windowHeight() / 2 - MAP_HEIGHT - window.now.y,
    MAP_WIDTH * 3,
    MAP_HEIGHT,
  );
  drawRectangle(
    windowWidth() / 2 - MAP_WIDTH - window.now.x,
    windowHeight() / 2 + MAP_HEIGHT - window.now.y,
    MAP_WIDTH * 3,
    MAP_HEIGHT,
  );
}

function DrawItems() {
  setColor(`rgb(77,38,0)`, 'transparent');
  window.items.forEach(item => {
    if (item.type == 'line')
      drawLine(
        windowWidth() / 2 + item.S.x - window.now.x,
        windowHeight() / 2 + item.S.y - window.now.y,
        windowWidth() / 2 + item.T.x - window.now.x,
        windowHeight() / 2 + item.T.y - window.now.y,
        'round',
        20,
      );
  });
}

function DrawTimeBoard() {
  var second = ((new Date().getTime() - window.gameStartTime) / 1000).toFixed(0);
  var time = `${String(Math.floor((window.gameLength - second) / 60)).padStart(2, '0')}`
    + ` : ${String((window.gameLength - second) % 60).padStart(2, '0')}`;
  $(".timeBoard-time").html(time);
  $(".timeBoard-money").html(`${money} pts`);
}

function DrawPlayer() {
  window.player.forEach(player => {
    setColor('transparent', '#000');
    drawCircle(
      windowWidth() / 2 + player.x - window.now.x,
      windowHeight() / 2 + player.y - window.now.y,
      20,
    );
  });
}

function DrawShadow() {
  setColor('transparent', '#000');
  for (var item of window.items) {
    var { S: { x: x1, y: y1 }, T: { x: x2, y: y2 } } = item;
    x1 -= window.now.x, y1 -= window.now.y;
    x2 -= window.now.x, y2 -= window.now.y;
    this.ctx.lineWidth = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(
      windowWidth() / 2 + x2,
      windowHeight() / 2 + y2,
    );
    this.ctx.lineTo(
      windowWidth() / 2 + x1,
      windowHeight() / 2 + y1,
    );
    var tmp = ArcSine(x2, y2) - ArcSine(x1, y1);
    if (tmp < 0) tmp += Math.PI * 2;
    this.ctx.arc(
      windowWidth() / 2, windowHeight() / 2,
      VIEW_R * 2, ArcSine(x1, y1), ArcSine(x2, y2),
      tmp > Math.PI
    );
    this.ctx.fill();
  }
}

function Draw() {
  this.ctx.clearRect(0, 0, windowWidth(), windowHeight());
  if (window.gameStage == GAME_STAGE.PLAYING) {
    setColor('transparent', '#000');
    this.ctx.fillRect(0, 0, windowWidth(), windowHeight());
    this.ctx.save();
    this.ctx.beginPath();
    var x = window.mouse.x - windowWidth() / 2,
      y = window.mouse.y - windowHeight() / 2;
    [x, y] = [x / Math.hypot(x, y), y / Math.hypot(x, y)];
    var d = Math.asin(y / Math.hypot(x, y));
    if (x < 0 && d > 0) d = Math.PI - d;
    else if (x < 0 && d < 0) d = - Math.PI - d;
    this.ctx.moveTo(windowWidth() / 2, windowHeight() / 2);
    this.ctx.arc(
      windowWidth() / 2,
      windowHeight() / 2,
      VIEW_R, 0, Math.PI * 2
    );
    this.ctx.clip();
    setColor('transparent', '#fff');
    this.ctx.fillRect(0, 0, windowWidth(), windowHeight());
    DrawArrow();
    DrawBackground();
    DrawItems();
    DrawShadow();
    DrawTimeBoard();
    DrawPlayer();
    this.ctx.restore();
  }
}

$(document).ready(() => {
  initWindow();
  initMap();
  window.gameStage = GAME_STAGE.LOADING_ROOM;
  window.money = 0;
  var canvas = $("#gameCanvas")[0];
  $('body').mousemove(e => {
    window.mouse = { x: e.clientX, y: e.clientY };
  });
  this.ctx = canvas.getContext("2d");
  setInterval(Draw, 50);
  loadRoom(window.location.pathname.split('/')[2]);
});