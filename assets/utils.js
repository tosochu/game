function RandInt(l, r) {
  return Math.floor(Math.random() * (r - l + 1)) + l;
}

function windowHeight() {
  return $(window).height();
}
function windowWidth() {
  return $(window).width();
}
function initWindow() {
  $("#gameCanvas").attr("height", windowHeight());
  $("#gameCanvas").attr("width", windowWidth());
}

function setColor(stroke, fill) {
  this.ctx.strokeStyle = stroke;
  this.ctx.fillStyle = fill;
}

function drawLine(x1, y1, x2, y2, lineCap, width) {
  this.ctx.lineCap = lineCap;
  this.ctx.lineWidth = width;
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
  return ctx.measureText(text).width;
}
function drawCenterText(x, y, font, text) {
  this.ctx.font = font;
  ctx.fillText(text, x - getTextWidth(font, text) / 2, y);
}
function drawLeftText(x, y, font, text) {
  this.ctx.font = font;
  ctx.fillText(text, x, y);
}
function drawRightText(x, y, font, text) {
  this.ctx.font = font;
  ctx.fillText(text, x - getTextWidth(font, text), y);
}