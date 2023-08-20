const GAME_STAGE = {
  LOADING_ROOM: 1,
  WAITING_START: 2,
  PLAYING: 3
};

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
  var d = Math.asin(y / Math.hypot(x, y));
  if (x < 0 && d > 0) d = Math.PI - d;
  else if (x < 0 && d < 0) d = - Math.PI - d;
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
  const BlockLength = 200;
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

function Draw() {
  this.ctx.clearRect(0, 0, windowWidth(), windowHeight());
  if (window.gameStage == GAME_STAGE.PLAYING) {
    DrawArrow();
    DrawBackground();
    DrawTimeBoard();
    DrawPlayer();
  }
}

$(document).ready(() => {
  initWindow();
  initMap();
  window.gameStage = GAME_STAGE.LOADING_ROOM;
  window.money = 0;
  var canvas = $("#gameCanvas")[0];
  canvas.addEventListener('mousemove', e => {
    window.mouse = { x: e.clientX, y: e.clientY };
  });
  this.ctx = canvas.getContext("2d");
  setInterval(Draw, 50);
  loadRoom(window.location.pathname.split('/')[2]);
});