const GAME_STAGE = {
  LOADING_ROOM: 1,
  PLAYING: 2,
};
const ROOM_STATUS = {
  WAITING: 1,
  PLAYING: 2,
  CLOSED: 3,
};
const VIEW_R = 500;
const BlockLength = 200;

async function loadRoom() {
  var response = await fetch("/api/room/load", {
    "headers": { "content-type": "application/json" },
    "body": JSON.stringify({ roomId: window.roomId }),
    "method": "POST",
  });
  var room = await response.json();
  if (room.error) {
    window.alert(room.error);
    window.location.pathname = '';
  }
  window.isAdmin = room.isAdmin;
  window.status = room.status;
  window.gameStartTime = 0;
  window.gameLength = room.length;
  window.gameStage = GAME_STAGE.PLAYING;
}

$(window).resize(initWindow);

function DrawArrow() {
  var x = window.mouse.x - windowWidth() / 2,
    y = window.mouse.y - windowHeight() / 2;
  if (Math.hypot(x, y) <= 50 || window.isWatching) return;
  var d = ArcSine(x, y);
  var greyness = 330 - Math.min(Math.hypot(x, y), 100) * 1.5;
  setColor(`rgb(${greyness},${greyness},${greyness})`, 'transparent');
  this.ctx.lineWidth = 12;
  drawLine(
    windowWidth() / 2,
    windowHeight() / 2,
    window.mouse.x,
    window.mouse.y,
    'round',
  );
  drawLine(
    window.mouse.x - Math.cos(d - Math.PI / 4) * 30 * (y == 0 && x < 0 ? -1 : 1),
    window.mouse.y - Math.sin(d - Math.PI / 4) * 30 * (y == 0 && x < 0 ? -1 : 1),
    window.mouse.x,
    window.mouse.y,
    'round',
  );
  drawLine(
    window.mouse.x - Math.cos(d + Math.PI / 4) * 30 * (y == 0 && x < 0 ? -1 : 1),
    window.mouse.y - Math.sin(d + Math.PI / 4) * 30 * (y == 0 && x < 0 ? -1 : 1),
    window.mouse.x,
    window.mouse.y,
    'round',
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
  setColor(`#bbb`, 'transparent');
  this.ctx.lineWidth = 5;
  window.items.forEach(item => {
    if (item.type == 'web') {
      drawWeb(
        windowWidth() / 2 + item.x - window.now.x,
        windowHeight() / 2 + item.y - window.now.y,
        item.r,
      );
    }
  });
  setColor(`rgb(77,38,0)`, 'transparent');
  this.ctx.lineWidth = 20;
  window.items.forEach(item => {
    if (item.type == 'line')
      drawLine(
        windowWidth() / 2 + item.S.x - window.now.x,
        windowHeight() / 2 + item.S.y - window.now.y,
        windowWidth() / 2 + item.T.x - window.now.x,
        windowHeight() / 2 + item.T.y - window.now.y,
        'round',
      );
  });
}

function DrawPlayer() {
  window.borderTip = '';
  for (var user in window.player) {
    var player = window.player[user];
    if (player.type == 'hunter') window.borderTip = 'red';
    setColor('transparent', player.type == 'fugitive' ? 'blue' : 'red');
    drawCircle(
      windowWidth() / 2 + player.x - window.now.x,
      windowHeight() / 2 + player.y - window.now.y,
      20,
    );
    this.ctx.lineWidth = 1;
    setColor('#000', '#fff');
    drawCenterText(
      windowWidth() / 2 + player.x - window.now.x,
      windowHeight() / 2 + player.y - window.now.y - 25,
      '20px Consolas',
      player.type == 'hunter' ? `Hunter${user}` : user,
    )
  };
}

function DrawShadow() {
  setColor('transparent', '#000');
  for (var item of window.items) {
    if (item.type == 'line') {
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
}

function DrawBorderTip(color) {
  setColor('transparent', color);
  this.ctx.globalAlpha = 0.015 * (1 + Math.sin(new Date().getTime() / 100));
  for (var i = 75; i > 0; i -= 5) {
    var w = windowWidth(), h = windowHeight();
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(w, 0);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(0, h);
    this.ctx.lineTo(0, 0);
    this.ctx.lineTo(i, i);
    this.ctx.lineTo(i, h - i);
    this.ctx.lineTo(w - i, h - i);
    this.ctx.lineTo(w - i, i);
    this.ctx.lineTo(i, i);
    this.ctx.fill();
  }
  this.ctx.globalAlpha = 1.0;
}

const MAX_SMALL_MAP = 150, MIN_SMALL_MAP = 90;
function DrawSmallMap() {
  var mapW = window.smallMapLengthDisplay,
    mapH = mapW / MAP_WIDTH * MAP_HEIGHT,
    mapX = windowWidth() - mapW - 10, mapY = 10;
  function getX(x) { return mapX + x / MAP_WIDTH * mapW; }
  function getY(y) { return mapY + y / MAP_HEIGHT * mapH; }
  function getWidth(l) { return l / MAP_WIDTH * mapW; }
  setColor('transparent', '#88888888');
  drawRoundRectangle(mapX, mapY, mapW, mapH, 5);
  setColor('green', 'transparent');
  this.ctx.lineWidth = 1;
  drawRectangle(
    getX(MAP_WIDTH / 2 - BlockLength * 8),
    getY(MAP_HEIGHT / 2 - BlockLength * 3),
    getWidth(BlockLength * 16),
    getWidth(BlockLength * 6),
  );
  setColor('transparent', 'blue');
  if (window.settings.displayTeammates)
    for (var user in window.player) {
      var player = window.player[user];
      if (window.settings.displayAll || player.type == 'fugitive')
        drawCircle(getX(player.x), getY(player.y), getWidth(200));
    }
  setColor('transparent', 'red');
  drawCircle(getX(window.now.x), getY(window.now.y), getWidth(200));
}

function UpdateTimeBoard() {
  if (window.status == ROOM_STATUS.PLAYING) $(".timeBoard-header").html('游戏剩余时间');
  var nowTime = new Date().getTime(); if (window.status == ROOM_STATUS.WAITING) nowTime = 0;
  var second = ((nowTime - window.gameStartTime) / 1000).toFixed(0);
  var time = `${String(Math.floor((window.gameLength - second) / 60)).padStart(2, '0')}`
    + ` : ${String((window.gameLength - second) % 60).padStart(2, '0')}`;
  $(".timeBoard-time").html(time);
  if (window.isAdmin && window.status == ROOM_STATUS.WAITING) {
    $(".playerList").addClass('admin');
    $(".timeBoard-money").addClass('admin');
    $(".timeBoard-money").removeClass('player');
    $(".timeBoard-money").html('开始游戏');
  }
  else {
    $(".playerList").removeClass('admin');
    $(".timeBoard-money").removeClass('admin');
    if (window.status == ROOM_STATUS.WAITING) {
      $(".timeBoard-money").addClass('player');
      $(".timeBoard-money").html('等待开始游戏');
    }
    else {
      $(".timeBoard-money").removeClass('player');
      $(".timeBoard-money").html(`${money} pts`);
    }
  }
}

function UpdatePlayerList() {
  for (var roommate of window.roommates) {
    if (window.markAsHunter.includes(roommate.name)) {
      $(`.playerName-${roommate.name}`).removeClass('fugitive');
      $(`.playerName-${roommate.name}`).addClass('hunter');
    }
    else {
      $(`.playerName-${roommate.name}`).removeClass('hunter');
      $(`.playerName-${roommate.name}`).addClass('fugitive');
    }
    if (window.solvedRoommates.includes(roommate.name)) continue;
    window.solvedRoommates.push(roommate.name);
    $('.playerList').append(`<div class="playerList-player ${roommate.type} playerName-${roommate.name}">${roommate.name}</div>`);
    $(`.playerName-${roommate.name}`).click(() => { window.changePlayerType(roommate.name); });
  }
}

function Draw() {
  this.ctx.clearRect(0, 0, windowWidth(), windowHeight());
  setColor('transparent', '#000');
  this.ctx.fillRect(0, 0, windowWidth(), windowHeight());
  if (window.status == ROOM_STATUS.CLOSED) {
    setTimeout(() => { window.location.pathname = '/' }, 3000);
    clearInterval(window.drawInterval);
  }
  else if (window.gameStage == GAME_STAGE.PLAYING) {
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
    DrawPlayer();
    DrawShadow();
    this.ctx.restore();
    if (window.borderTip) DrawBorderTip(window.borderTip);
    DrawSmallMap();
    UpdateTimeBoard();
    UpdatePlayerList();
  }
}

$(document).ready(() => {
  initWindow();
  initMap();
  initSettings();
  window.gameStage = GAME_STAGE.LOADING_ROOM;
  window.money = 0;
  window.solvedRoommates = [];
  window.roommates = [];
  window.markAsHunter = [];
  window.isWatching = false;
  window.borderTip = '';
  var canvas = $("#gameCanvas")[0];
  $('body').mousemove(e => window.mouse = { x: e.clientX, y: e.clientY });
  $(document).mousedown(() => window.mousedown = true);
  $(document).mouseup(() => window.mousedown = false);
  $(document).keypress(e => { if (e.keyCode == 32) window.quickMode = true; });
  $(document).keyup(e => { if (e.keyCode == 32) window.quickMode = false; });
  this.ctx = canvas.getContext("2d");
  window.drawInterval = setInterval(Draw, 50);
  window.smallMapLength = MIN_SMALL_MAP;
  window.smallMapLengthDisplay = MIN_SMALL_MAP;
  setInterval(() => {
    smallMapLengthDisplay = smallMapLengthDisplay * 0.3 + smallMapLength * 0.7;
    if (window.mouse.x > windowWidth() - smallMapLengthDisplay - 10
      && window.mouse.y < smallMapLengthDisplay / MAP_WIDTH * MAP_HEIGHT + 10) smallMapLength = MAX_SMALL_MAP;
    else smallMapLength = MIN_SMALL_MAP;
  }, 50);
  loadRoom();
});