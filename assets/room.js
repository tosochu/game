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
  console.log(room);
}

$(window).resize(initWindow);

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

function DrawTimeBoard() {
  var second = ((new Date().getTime() - window.gameStartTime) / 1000).toFixed(0);
  var time = `${String(Math.floor((window.gametime - second) / 60)).padStart(2, '0')}`
    + ` : ${String((window.gametime - second) % 60).padStart(2, '0')}`;
  console.log(window.gametime - second, second);
  $(".timeBoard-time").html(time);
  $(".timeBoard-money").html(`${money} pts`);
}

function Draw() {
  var canvas = $("#gameCanvas")[0];
  this.ctx = canvas.getContext("2d");
  this.ctx.clearRect(0, 0, windowWidth(), windowHeight());
  DrawTimeBoard();
  DrawPlayer();
}

$(document).ready(() => {
  initWindow();
  initMap();
  window.gameStage = GAME_STAGE.LOADING_ROOM;
  // window.gametime = prompt("Input the game time");
  window.gametime = 100;
  window.gameStartTime = new Date().getTime();
  window.money = 0;
  // setInterval(Draw, 50);
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