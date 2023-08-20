const MAP_WIDTH = 10000, MAP_HEIGHT = 8000;
function initMap() {
  window.now = { x: RandInt(3000, 4000), y: RandInt(1000, 2000) };
  window.player = [window.now];
}