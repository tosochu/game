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
      10,
    );
  });
}

function Draw() {
  var canvas = $("#gameCanvas")[0];
  this.ctx = canvas.getContext("2d");
  this.ctx.clearRect(0, 0, windowWidth(), windowHeight());
  if (window.gameStage == GAME_STAGE.PLAYING) {
    DrawBackground();
    DrawTimeBoard();
    DrawPlayer();
  }
}

$(document).ready(() => {
  initWindow();
  initMap();
  window.gameStage = GAME_STAGE.LOADING_ROOM;
  // window.gametime = prompt("Input the game time");
  window.gameLength = 100;
  window.gameStartTime = new Date().getTime();
  window.money = 0;
  setInterval(Draw, 50);
  loadRoom(window.location.pathname.split('/')[2]);
});

/*
mycanvas.mousedown(function(e){
    console.log(e.clientX,e.clientY);
});
 
mycanvas.mousemove(function(e){
    console.log(e.clientX,e.clientY);
});
 
mycanvas.mouseup(function(e){
    console.log(e.clientX,e.clientY);
});
*/