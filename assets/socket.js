var socket, connected = false;

function textToSafeHtml(text) {
  return text.replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char] || tag));
}

function startConnection() {
  console.log("Conneted!");
  connected = true;
}

function getMessage(message) {
  try {
    var messages = JSON.parse(message.data);
    window.now = messages.now;
    window.player = messages.player;
    window.items = messages.items;
    window.prop = messages.prop;
    window.status = messages.status;
    window.gameStartTime = messages.startAt || 0;
    window.roommates = messages.roommates;
    window.isWatching = messages.isWatching;
    if (window.status == 2) {
      let tmp = [];
      for (var roommate of window.roommates)
        if (roommate.type == 'hunter') tmp.push(roommate.name);
      window.markAsHunter = tmp;
    }
  }
  catch (e) { console.log(e); }
}

function closeSocket() {
  connected = false;
  setTimeout(() => {
    socket = new WebSocket(`${window.location.protocol.replace('http', 'ws')}//${window.location.host}/room/${window.roomId}`);
    socket.onopen = startConnection;
    socket.onmessage = getMessage;
    socket.onclose = closeSocket;
  }, 1000);
}

$(document).ready(() => {
  window.roomId = window.location.pathname.split('/')[2];
  socket = new WebSocket(`${window.location.protocol.replace('http', 'ws')}//${window.location.host}/room/${window.roomId}`);
  socket.onopen = startConnection;
  socket.onmessage = getMessage;
  socket.onclose = closeSocket;
  window.mouse = { x: windowWidth() / 2, y: windowHeight() / 2 }

  setInterval(() => {
    if (!connected) return;
    var x = window.mouse.x - windowWidth() / 2,
      y = window.mouse.y - windowHeight() / 2;
    socket.send(JSON.stringify({
      direction: { x, y },
      speed: (Math.min(Math.hypot(x, y), 100)) * (window.mousedown ? 1.2 : 1),
    }));
  }, 25);
});