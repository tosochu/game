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
  }
  catch (e) { console.log(e); }
}

function closeSocket() {
  connected = false;
  setTimeout(() => {
    socket = new WebSocket(`${window.location.protocol.replace('http', 'ws')}//${window.location.host}/room/${window.location.pathname.split('/')[2]}`);
    socket.onopen = startConnection;
    socket.onmessage = getMessage;
    socket.onclose = closeSocket;
  }, 1000);
}

$(document).ready(() => {
  socket = new WebSocket(`${window.location.protocol.replace('http', 'ws')}//${window.location.host}/room/${window.location.pathname.split('/')[2]}`);
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
      speed: Math.hypot(x, y)
    }));
  }, 100);
});