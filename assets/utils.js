function RandInt(l, r) {
  return Math.floor(Math.random() * (r - l + 1)) + l;
}

function ArcSine(x, y) {
  var d = Math.asin(y / Math.hypot(x, y));
  if (x < 0 && d > 0) d = Math.PI - d;
  else if (x < 0 && d < 0) d = - Math.PI - d;
  return d;
}

function windowWidth() {
  return $(window).width();
}
function windowHeight() {
  return $(window).height();
}
function initWindow() {
  $("#gameCanvas").attr("height", windowHeight());
  $("#gameCanvas").attr("width", windowWidth());
}

function setColor(stroke, fill) {
  this.ctx.strokeStyle = stroke;
  this.ctx.fillStyle = fill;
}

function drawLine(x1, y1, x2, y2, lineCap) {
  this.ctx.lineCap = lineCap;
  this.ctx.beginPath();
  this.ctx.moveTo(x1, y1);
  this.ctx.lineTo(x2, y2);
  this.ctx.stroke();
}

function drawCircle(x, y, r) {
  this.ctx.beginPath();
  this.ctx.arc(x, y, r, 0, Math.PI * 2, false);
  this.ctx.stroke();
  this.ctx.fill();
}

function drawRectangle(x, y, width, height) {
  this.ctx.beginPath();
  this.ctx.moveTo(x, y);
  this.ctx.lineTo(x + width, y);
  this.ctx.lineTo(x + width, y + height);
  this.ctx.lineTo(x, y + height);
  this.ctx.lineTo(x, y);
  this.ctx.stroke();
  this.ctx.fill();
}
function drawRoundRectangle(x, y, width, height, r) {
  this.ctx.beginPath();
  this.ctx.moveTo(x + r, y);
  this.ctx.lineTo(x + width - r, y);
  this.ctx.arc(x + width - r, y + r, r, Math.PI / 180 * 270, 0, false);
  this.ctx.lineTo(x + width, y + height - r);
  this.ctx.arc(x + width - r, y + height - r, r, 0, Math.PI / 180 * 90, 0, false);
  this.ctx.lineTo(x + r, y + height);
  this.ctx.arc(x + r, y + height - r, r, Math.PI / 180 * 90, Math.PI / 180 * 180, false);
  this.ctx.lineTo(x, y + r);
  this.ctx.arc(x + r, y + r, r, Math.PI / 180 * 180, Math.PI / 180 * 270, false);
  this.ctx.stroke();
  this.ctx.fill();
}

function getTextWidth(font, text) {
  this.ctx.font = font;
  return this.ctx.measureText(text).width;
}
function drawCenterText(x, y, font, text) {
  this.ctx.font = font;
  this.ctx.fillText(text, x - getTextWidth(font, text) / 2, y);
  this.ctx.strokeText(text, x - getTextWidth(font, text) / 2, y);
}
function drawLeftText(x, y, font, text) {
  this.ctx.font = font;
  this.ctx.fillText(text, x, y);
  this.ctx.strokeText(text, x, y);
}
function drawRightText(x, y, font, text) {
  this.ctx.font = font;
  this.ctx.fillText(text, x - getTextWidth(font, text), y);
  this.ctx.strokeText(text, x - getTextWidth(font, text), y);
}

function drawWeb(x, y, r) {
  var cnt1 = 5; if (r > 60) cnt1++; if (r > 120) cnt1++;
  for (var i = 0; i < cnt1; i++) {
    var d = i * Math.PI * 2 / cnt1 - Math.PI;
    drawLine(x, y, x + Math.cos(d) * r, y + Math.sin(d) * r, 'round',);
  }
  var cnt2 = 2; if (r > 100) cnt2++; if (r > 150) cnt2++;
  for (var j = 1; j <= 3; j++) {
    var r2 = (r - 10) / 3 * j;
    for (var i = 0; i < cnt1; i++) {
      var d1 = i * Math.PI * 2 / cnt1 - Math.PI,
        d2 = (i + 1) * Math.PI * 2 / cnt1 - Math.PI;
      this.ctx.beginPath();
      this.ctx.arc(
        x + (Math.cos(d1) + Math.cos(d2)) * r2,
        y + (Math.sin(d1) + Math.sin(d2)) * r2,
        r2, d1 + Math.PI, d2 + Math.PI, false,
      );
      this.ctx.stroke();
    }
  }
}