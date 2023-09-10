function RandInt(l, r) {
  return Math.floor(Math.random() * (r - l + 1)) + l;
}
const MAP_WIDTH = 10000, MAP_HEIGHT = 8000;
const PLAYER_R = 20, BLOCK_LENGTH = 200;
const VIEW_R = 500;
const { ROOM_STATUS, PLAYER_STATUS } = require('./status.js');
const { Heap } = require('./heap.js');

function checkSegmentCrossSegment(A, B, C, D) {
  var vector1 = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  var vector2 = (B.x - A.x) * (A.y - C.y) - (B.y - A.y) * (A.x - C.x);
  var vector3 = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);
  if (vector3 !== 0) {
    var p1 = vector1 / vector3;
    var p2 = vector2 / vector3;
    if (0 < p1 && p1 < 1 && 0 < p2 && p2 < 1) return true;
  }
  return false;
}
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

function generateRoom(length) {
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
  return {
    length: length * 60,
    status: ROOM_STATUS.PLAYING,
    startAt: new Date().getTime(),
    player: {}, items,
  };
}

function generateHunters(count) {
  var hunters = {};
  for (var i = 0; i < count; i++)
    hunters[String(i + 1).padStart(3, '0')] = {
      x: RandInt(MAP_WIDTH / 2 - BLOCK_LENGTH * 7, MAP_WIDTH / 2 + BLOCK_LENGTH * 7),
      y: RandInt(MAP_HEIGHT / 2 - BLOCK_LENGTH * 2, MAP_HEIGHT / 2 + BLOCK_LENGTH * 2),
      type: 'hunter', d: { x: 0, y: 1 }, v: 0,
    };
  return hunters;
}

function checkPointInPolygon({ x, y }, polygon) {
  var result = false;
  for (var i = 0; i < polygon.length; i++) {
    var { x: x1, y: y1 } = polygon[i],
      { x: x2, y: y2 } = polygon[(i + 1) % polygon.length];
    if ((y1 > y) !== (y2 > y) && (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)) result = !result;
  }
  return result;
}

function getPointToSegmentDistance(x, y, x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  var d = dx * dx + dy * dy;
  var t = ((x - x1) * dx + (y - y1) * dy) / d;
  var p;
  if (!true) {
    p = { x: x1 + t * dx, y: y1 + t * dy };
  }
  else {
    if (d) {
      if (t < 0) p = { x: x1, y: y1 };
      else if (t > 1) p = { x: x2, y: y2 };
      else p = { x: x1 + t * dx, y: y1 + t * dy };
    }
    else {
      p = { x: x1, y: y1 };
    }
  }
  dx = x - p.x;
  dy = y - p.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function checkPolygonContainCircle({ x, y, r }, polygon) {
  if (!checkPointInPolygon({ x, y }, polygon)) return false;
  for (var i = 0; i < polygon.length; i++) {
    var { x: x1, y: y1 } = polygon[i],
      { x: x2, y: y2 } = polygon[(i + 1) % polygon.length];
    if (getPointToSegmentDistance(x, y, x1, y1, x2, y2) <= r) return false;
  }
  return true;
}

function checkShadowContainCircle(nowx, nowy, circle, x1, y1, x2, y2) {
  var mul = 1000000 / Math.hypot(x1 - nowx, y1 - nowy);
  var sx = nowx + (x1 - nowx) * mul, sy = nowy + (y1 - nowy) * mul;
  var tx = nowx + (x2 - nowx) * mul, ty = nowy + (y2 - nowy) * mul;
  var shadow = [{ x: x1, y: y1 }, { x: x2, y: y2 }, { x: tx, y: ty }, { x: sx, y: sy }];
  return checkPolygonContainCircle(circle, shadow);
}

function getPointToCircleTangent(x0, y0, { x, y, r }) {
  var dis = Math.hypot(x0 - x, y0 - y);
  var angle = Math.atan2(x0 - x, y0 - y), central_angle = Math.acos(r / dis);
  return [
    { x: x + Math.cos(angle - central_angle) * r, y: y + Math.sin(angle - central_angle) },
    { x: x + Math.cos(angle + central_angle) * r, y: y + Math.sin(angle + central_angle) }
  ];
}

function planShortestPath(items, sx, sy, tx, ty) {
  items = items.filter(x => x.type == 'line');
}

module.exports = {
  RandInt, VIEW_R, PLAYER_R,
  MAP_WIDTH, MAP_HEIGHT, BLOCK_LENGTH,
  checkSegmentCrossSegment,
  checkCircleCrossCircle,
  checkCircleCrossItem,
  checkCircleCrossRectangle,
  checkShadowContainCircle,
  getPointToCircleTangent,
  generateRoom, generateHunters,
  planShortestPath,
};