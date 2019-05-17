import {Canvas, contentView, device} from 'tabris';

contentView.append(
  <Canvas stretch onResize={drawGraph}/>
);

class Graph {

  constructor() {
    this._angle = 0;
    this._speedometer = new Speedometer();
  }

  draw(ctx, width, height) {
    this._ctx = ctx;
    this._width = width;
    this._height = height;
    this._ctx.font = '18px sans-serif';
    this._ctx.lineJoin = 'round';
    this._cx = Math.floor(this._width / 3);
    this._cy = Math.floor(this._height / 2);
    this._unit = this._width / 12;
    this._draw();
  }

  _draw() {
    this._clear();
    this._drawAxes(this._angle);
    this._drawSine(this._angle);
    this._drawCircle();
    this._drawLever(this._angle);
    this._drawUpdatesLabel();
    // re-schedule
    this._speedometer.update();
    this._angle = this._normalizeAngle(this._angle - Math.PI / 90);
    setTimeout(() => this._draw(), 0);
  }

  _clear() {
    this._ctx.clearRect(0, 0, this._width, this._height);
  }

  _normalizeAngle(angle) {
    return angle > Math.PI * 2 ? angle - Math.PI * 2 : angle < 0 ? angle + Math.PI * 2 : angle;
  }

  _drawAxes(angle) {
    const p = this._normalizeAngle(Math.PI * 2 - angle);
    const p2 = this._normalizeAngle(Math.PI - angle);
    this._ctx.strokeStyle = '#aaa';
    this._ctx.lineWidth = 1;
    this._ctx.beginPath();
    // x and y axes
    this._ctx.moveTo(this._cx - 3 * this._unit, this._cy);
    this._ctx.lineTo(this._cx + 2.25 * Math.PI * this._unit, this._cy);
    this._ctx.moveTo(this._cx, this._cy - 1.5 * this._unit);
    this._ctx.lineTo(this._cx, this._cy + 1.5 * this._unit);
    // x axis ticks
    this._ctx.moveTo(this._cx + p * this._unit, this._cy - 5);
    this._ctx.lineTo(this._cx + p * this._unit, this._cy + 5);
    this._ctx.moveTo(this._cx + p2 * this._unit, this._cy - 5);
    this._ctx.lineTo(this._cx + p2 * this._unit, this._cy + 5);
    // y axis ticks
    this._ctx.moveTo(this._cx - 5, this._cy + this._unit);
    this._ctx.lineTo(this._cx + 5, this._cy + this._unit);
    this._ctx.moveTo(this._cx - 5, this._cy - this._unit);
    this._ctx.lineTo(this._cx + 5, this._cy - this._unit);
    this._ctx.stroke();
    // x axis labels
    this._ctx.fillStyle = '#aaa';
    this._ctx.font = '12px sans-serif';
    this._ctx.textAlign = 'center';
    this._ctx.textBaseline = 'top';
    this._ctx.fillText('π', this._cx + p * this._unit, this._cy + 8);
    this._ctx.fillText('2π', this._cx + p2 * this._unit, this._cy + 8);
    // y axis labels
    this._ctx.textAlign = 'left';
    this._ctx.textBaseline = 'middle';
    this._ctx.fillText('1', this._cx + 8, this._cy - this._unit);
    this._ctx.fillText('-1', this._cx + 8, this._cy + this._unit);
  }

  _drawSine(angle) {
    let x;
    let y;
    const steps = 50;
    this._ctx.beginPath();
    this._ctx.moveTo(this._cx, this._cy + Math.sin(angle) * this._unit);
    for (let i = 0; i <= steps; i++) {
      x = i * 2 * Math.PI / steps;
      y = Math.sin(angle + x);
      this._ctx.lineTo(this._cx + x * this._unit, this._cy + y * this._unit);
    }
    this._ctx.strokeStyle = '#fa0';
    this._ctx.lineWidth = 2;
    this._ctx.stroke();
  }

  _drawCircle() {
    const ccx = this._cx - 1.5 * this._unit;
    this._ctx.strokeStyle = '#0af';
    this._ctx.lineWidth = 2;
    this._ctx.beginPath();
    this._ctx.arc(ccx, this._cy, this._unit, 0, 2 * Math.PI);
    this._ctx.stroke();
  }

  _drawLever(t) {
    const ccx = this._cx - 1.5 * this._unit;
    const x = ccx + Math.cos(t) * this._unit;
    const y = this._cy + Math.sin(t) * this._unit;
    this._ctx.strokeStyle = '#0af';
    this._ctx.fillStyle = '#fff';
    this._ctx.lineWidth = 2;
    this._ctx.beginPath();
    // lines
    this._ctx.moveTo(x, y);
    this._ctx.lineTo(this._cx, y);
    this._ctx.moveTo(ccx, this._cy);
    this._ctx.lineTo(x, y);
    this._ctx.stroke();
    // hinges
    this._ctx.lineWidth = 1;
    this._ctx.beginPath();
    const radius = 3;
    this._ctx.arc(x, y, radius, 0, 2 * Math.PI);
    this._ctx.moveTo(this._cx + radius / 2, y);
    this._ctx.arc(this._cx, y, radius, 0, 2 * Math.PI);
    this._ctx.fill();
    this._ctx.stroke();
  }

  _drawUpdatesLabel() {
    this._ctx.textAlign = 'left';
    this._ctx.textBaseline = 'top';
    this._ctx.fillStyle = '#000';
    this._ctx.lineWidth = 1;
    this._ctx.fillText('Updates per second: ' + this._speedometer._updates.toFixed(1), 10, 10);
  }

}

class Speedometer {

  constructor() {
    this._start = 0;
    this._count = 0;
    this._updates = 0;
  }

  update() {
    const now = Date.now();
    const time = now - this._start;
    this._count++;
    if (this._start === 0) {
      this._start = now;
    } else if (time >= 1000) {
      this._updates = this._count / (time / 1000);
      this._start = now;
      this._count = 0;
    }
  }
}

const graph = new Graph();

function drawGraph({target: canvas, width, height}) {
  const scaleFactor = device.scaleFactor;
  const ctx = canvas.getContext('2d', width * scaleFactor, height * scaleFactor);
  // scale canvas to be pixel exact
  ctx.scale(scaleFactor, scaleFactor);
  graph.draw(ctx, width, height);
}
