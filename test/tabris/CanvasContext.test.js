import {expect, stub, spy, restore} from "../test";
import ProxyStore from "../../src/tabris/ProxyStore";
import NativeBridge from "../../src/tabris/NativeBridge";
import GC from "../../src/tabris/GC";
import NativeBridgeSpy from "./NativeBridgeSpy";
import CanvasContext from "../../src/tabris/CanvasContext";
import ImageData from "../../src/tabris/ImageData";
import Canvas from "../../src/tabris/widgets/Canvas";
import Events from "../../src/tabris/Events";

describe("CanvasContext", function() {

  let nativeBridge;
  let ctx;
  let gc;

  beforeEach(function() {
    nativeBridge = new NativeBridgeSpy();
    global.tabris = Object.assign({
      on: () => {},
      off: () => {},
      _proxies: new ProxyStore()
    }, Events);
    global.device = {platform: "Android"};
    global.tabris._nativeBridge = new NativeBridge(nativeBridge);
    gc = new GC();
    ctx = new CanvasContext(gc);
  });

  afterEach(function() {
    restore();
    gc.dispose();
  });

  function flush() {
    tabris.trigger("flush");
  }

  function getLastPacket() {
    let calls = nativeBridge.calls({id: gc.cid, op: "call", method: "draw"});
    return calls.length ? calls[calls.length - 1].parameters.packedOperations : undefined;
  }

  function decodeLastPacket() {
    let calls = nativeBridge.calls({id: gc.cid, op: "call", method: "draw"});
    return calls.length ? decode(calls[calls.length - 1].parameters.packedOperations) : {};
  }

  function decode(packet) {
    let values = {};
    let opcodes = packet[0];
    values.ops = packet[1].map(opIndex => opcodes[opIndex]);
    ["doubles", "booleans", "strings", "ints"].forEach((name, index) => {
      let slot = packet[index + 2];
      if (slot.length) {
        values[name] = slot;
      }
    });
    return values;
  }

  describe("getContext", function() {

    let canvas;

    beforeEach(function() {
      canvas = new Canvas();
      nativeBridge.resetCalls();
    });

    it("returns null without \"2d\" parameter", function() {
      expect(canvas.getContext("foo", 100, 200)).to.equal(null);
    });

    it("creates a native GC with parent", function() {
      canvas.getContext("2d", 100, 200);

      let createCalls = nativeBridge.calls({op: "create", type: "rwt.widgets.GC"});
      expect(createCalls.length).to.equal(1);
      expect(createCalls[0].properties.parent).to.equal(canvas.cid);
    });

    it("creates and returns graphics context", function() {
      let ctx = canvas.getContext("2d", 100, 200);

      expect(ctx).to.be.an.instanceof(CanvasContext);
    });

    it("returns same instance everytime", function() {
      let ctx1 = canvas.getContext("2d", 100, 200);

      let ctx2 = canvas.getContext("2d", 100, 200);

      expect(ctx2).to.equal(ctx1);
    });

    it("calls init", function() {
      canvas.getContext("2d", 100, 200);

      let call = nativeBridge.calls({op: "call", method: "init"})[0];
      expect(call.parameters.width).to.eql(100);
      expect(call.parameters.height).to.eql(200);
    });

    it("calls init everytime", function() {
      canvas.getContext("2d", 100, 200);

      canvas.getContext("2d", 200, 100);

      let call = nativeBridge.calls({op: "call", method: "init"})[1];
      expect(call.parameters.width).to.eql(200);
      expect(call.parameters.height).to.eql(100);
    });

    it("updates width and height in canvas dummy", function() {
      ctx = canvas.getContext("2d", 100, 200);

      expect(ctx.canvas.width).to.eql(100);
      expect(ctx.canvas.height).to.eql(200);
    });

    it("allows to set canvas.style attributes", function() {
      // Used by third party libraries, ensure this doesn't crash
      ctx.canvas.style.width = 23;
      expect(ctx.canvas.style.width).to.equal(23);
    });

  });

  describe("property", function() {

    describe("lineWidth", function() {

      it("defaults to 1", function() {
        expect(ctx.lineWidth).to.eql(1);
      });

      it("accepts changes", function() {
        ctx.lineWidth = 2;

        expect(ctx.lineWidth).to.eql(2);
      });

      it("renders changes", function() {
        ctx.lineWidth = 2;
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["lineWidth"], doubles: [2]});
      });

      it("ignores zero and negative values, but prints a warning", function() {
        spy(console, "warn");
        ctx.lineWidth = 3;

        ctx.lineWidth = 0;
        ctx.lineWidth = -1;

        expect(ctx.lineWidth).to.eql(3);
        expect(console.warn).to.have.been.calledWith("Unsupported value for lineWidth: 0");
        expect(console.warn).to.have.been.calledWith("Unsupported value for lineWidth: -1");
      });

    });

    describe("lineCap", function() {

      it("defaults to 'butt'", function() {
        expect(ctx.lineCap).to.eql("butt");
      });

      it("accepts changes", function() {
        ctx.lineCap = "round";

        expect(ctx.lineCap).to.eql("round");
      });

      it("renders changes", function() {
        ctx.lineCap = "round";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["lineCap"], strings: ["round"]});
      });

      it("ignores unknown values, but prints a warning", function() {
        spy(console, "warn");
        ctx.lineCap = "round";

        ctx.lineCap = "foo";

        expect(ctx.lineCap).to.eql("round");
        expect(console.warn).to.have.been.calledWith("Unsupported value for lineCap: foo");
      });

    });

    describe("lineJoin", function() {

      it("defaults to 'miter'", function() {
        expect(ctx.lineJoin).to.eql("miter");
      });

      it("accepts changes", function() {
        ctx.lineJoin = "round";

        expect(ctx.lineJoin).to.eql("round");
      });

      it("renders changes", function() {
        ctx.lineJoin = "round";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["lineJoin"], strings: ["round"]});
      });

      it("ignores unknown values, but prints a warning", function() {
        spy(console, "warn");
        ctx.lineJoin = "round";

        ctx.lineJoin = "foo";

        expect(ctx.lineJoin).to.eql("round");
        expect(console.warn).to.have.been.calledWith("Unsupported value for lineJoin: foo");
      });

    });

    describe("fillStyle", function() {

      it("defaults to black", function() {
        expect(ctx.fillStyle).to.eql("rgba(0, 0, 0, 1)");
      });

      it("accepts changes", function() {
        ctx.fillStyle = "red";

        expect(ctx.fillStyle).to.eql("rgba(255, 0, 0, 1)");
      });

      it("renders changes", function() {
        ctx.fillStyle = "red";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["fillStyle"], ints: [255, 0, 0, 255]});
      });

      it("ignores invalid color strings, but prints a warning", function() {
        spy(console, "warn");
        ctx.fillStyle = "red";

        ctx.fillStyle = "no-such-color";

        expect(ctx.fillStyle).to.eql("rgba(255, 0, 0, 1)");
        expect(console.warn).to.have.been.calledWith("Unsupported value for fillStyle: no-such-color");
      });

    });

    describe("strokeStyle", function() {

      it("defaults to black", function() {
        expect(ctx.strokeStyle).to.eql("rgba(0, 0, 0, 1)");
      });

      it("accepts changes", function() {
        ctx.strokeStyle = "red";

        expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
      });

      it("renders changes", function() {
        ctx.strokeStyle = "red";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["strokeStyle"], ints: [255, 0, 0, 255]});
      });

      it("ignores invalid color strings, but prints a warning", function() {
        spy(console, "warn");
        ctx.strokeStyle = "red";

        ctx.strokeStyle = "no-such-color";

        expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
        expect(console.warn).to.have.been.calledWith("Unsupported value for strokeStyle: no-such-color");
      });

    });

    describe("textAlign", function() {

      it("defaults to 'start'", function() {
        expect(ctx.textAlign).to.eql("start");
      });

      it("accepts changes", function() {
        ctx.textAlign = "center";

        expect(ctx.textAlign).to.eql("center");
      });

      it("renders changes", function() {
        ctx.textAlign = "center";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["textAlign"], strings: ["center"]});
      });

      it("ignores unknown values, but prints a warning", function() {
        spy(console, "warn");
        ctx.textAlign = "center";

        ctx.textAlign = "foo";

        expect(ctx.textAlign).to.eql("center");
        expect(console.warn).to.have.been.calledWith("Unsupported value for textAlign: foo");
      });

    });

    describe("textBaseline", function() {

      it("defaults to 'alphabetic'", function() {
        expect(ctx.textBaseline).to.eql("alphabetic");
      });

      it("accepts changes", function() {
        ctx.textBaseline = "middle";

        expect(ctx.textBaseline).to.eql("middle");
      });

      it("renders changes", function() {
        ctx.textBaseline = "middle";
        flush();

        expect(decodeLastPacket()).to.eql({ops: ["textBaseline"], strings: ["middle"]});
      });

      it("ignores unknown values, but prints a warning", function() {
        spy(console, "warn");
        ctx.textBaseline = "middle";

        ctx.textBaseline = "foo";

        expect(ctx.textBaseline).to.eql("middle");
        expect(console.warn).to.have.been.calledWith("Unsupported value for textBaseline: foo");
      });

    });

  });

  describe("save", function() {

    it("does not change current state", function() {
      ctx.strokeStyle = "red";
      ctx.save();

      expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
    });

    it("renders save operation", function() {
      ctx.save();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["save"]});
    });

  });

  describe("restore", function() {

    it("restores previous state", function() {
      ctx.strokeStyle = "red";
      ctx.save();
      ctx.strokeStyle = "blue";

      ctx.restore();

      expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
    });

    it("restores multiple steps", function() {
      ctx.strokeStyle = "red";
      ctx.save();
      ctx.strokeStyle = "blue";
      ctx.save();

      ctx.restore();
      ctx.restore();

      expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
    });

    it("does not change current state when stack is empty", function() {
      ctx.strokeStyle = "red";

      ctx.restore();

      expect(ctx.strokeStyle).to.eql("rgba(255, 0, 0, 1)");
    });

    it("renders restore operation", function() {
      ctx.restore();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["restore"]});
    });

  });

  describe("path operations", function() {

    it("aren't rendered before flush", function() {
      ctx.beginPath();
      ctx.moveTo(10, 20);
      ctx.lineTo(30, 40);
      ctx.rect(30, 40, 10, 20);
      ctx.arc(30, 40, 10, 1, 2);
      ctx.quadraticCurveTo(40, 50, 50, 60);
      ctx.bezierCurveTo(50, 70, 60, 80, 70, 80);
      ctx.closePath();

      expect(getLastPacket()).to.be.undefined;
    });

    it("are rendered on flush", function() {
      ctx.beginPath();
      ctx.moveTo(10, 20);
      ctx.lineTo(30, 40);
      ctx.rect(30, 40, 10, 20);
      ctx.arc(30, 40, 10, 1, 2);
      ctx.quadraticCurveTo(40, 50, 50, 60);
      ctx.bezierCurveTo(50, 70, 60, 80, 70, 80);
      ctx.closePath();

      flush();

      expect(decodeLastPacket().ops).to.eql(["beginPath", "moveTo", "lineTo", "rect", "arc",
                                              "quadraticCurveTo", "bezierCurveTo", "closePath"]);
    });

    it("are not rendered after gc disposal anymore", function() {
      ctx.rect(10, 20, 30, 40);

      gc.dispose();
      flush();

      expect(getLastPacket()).to.be.undefined;
    });

  });

  describe("transformations", function() {

    it("aren't rendered before flush", function() {
      ctx.setTransform(1, 2, 3, 4, 5, 6);
      ctx.transform(1, 2, 3, 4, 5, 6);
      ctx.translate(23, 42);
      ctx.rotate(3.14);
      ctx.scale(2, 3);

      expect(getLastPacket()).to.be.undefined;
    });

    it("are rendered on flush", function() {
      ctx.setTransform(1, 2, 3, 4, 5, 6);
      ctx.transform(1, 2, 3, 4, 5, 6);
      ctx.translate(23, 42);
      ctx.rotate(3.14);
      ctx.scale(2, 3);

      flush();

      expect(decodeLastPacket().ops).to.eql(["setTransform", "transform", "translate",
                                              "rotate", "scale"]);
    });

  });

  describe("operation names", function() {

    it("are rendered once", function() {
      ctx.lineTo(10, 20);
      ctx.moveTo(30, 40);
      flush();

      expect(getLastPacket()[0]).to.eql(["lineTo", "moveTo"]);
      expect(getLastPacket()[1]).to.eql([0, 1]);
    });

    it("are not rendered again", function() {
      ctx.lineTo(10, 20);
      ctx.moveTo(30, 40);
      flush();
      nativeBridge.resetCalls();

      ctx.lineTo(50, 60);
      ctx.moveTo(70, 80);
      flush();

      expect(getLastPacket()[0]).to.eql([]);
      expect(getLastPacket()[1]).to.eql([0, 1]);
    });

    it("are appended to existing operations", function() {
      ctx.lineTo(10, 20);
      ctx.moveTo(30, 40);
      flush();
      nativeBridge.resetCalls();

      ctx.rect(10, 20, 30, 40);
      flush();

      expect(getLastPacket()[0]).to.eql(["rect"]);
      expect(getLastPacket()[1]).to.eql([2]);
    });

  });

  describe("scale", function() {

    it("is rendered", function() {
      ctx.scale(2, 3);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["scale"], doubles: [2, 3]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.scale(2);
      }).to.throw("Not enough arguments to CanvasContext.scale");
    });

  });

  describe("rotate", function() {

    it("is rendered", function() {
      ctx.rotate(3.14);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["rotate"], doubles: [3.14]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.rotate();
      }).to.throw("Not enough arguments to CanvasContext.rotate");
    });

  });

  describe("translate", function() {

    it("is rendered", function() {
      ctx.translate(23, 42);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["translate"], doubles: [23, 42]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.translate(23);
      }).to.throw("Not enough arguments to CanvasContext.translate");
    });

  });

  describe("transform", function() {

    it("is rendered", function() {
      ctx.transform(1, 2, 3, 4, 5, 6);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["transform"], doubles: [1, 2, 3, 4, 5, 6]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.transform();
      }).to.throw("Not enough arguments to CanvasContext.transform");
    });

  });

  describe("setTransform", function() {

    it("is rendered", function() {
      ctx.setTransform(1, 2, 3, 4, 5, 6);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["setTransform"], doubles: [1, 2, 3, 4, 5, 6]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.setTransform();
      }).to.throw("Not enough arguments to CanvasContext.setTransform");
    });

  });

  describe("measureText", function() {

    it("is rendered", function() {
      expect(ctx.measureText("foo").width).to.be.above("foo".length);
    });

  });

  describe("beginPath", function() {

    it("is rendered", function() {
      ctx.beginPath();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["beginPath"]});
    });

  });

  describe("closePath", function() {

    it("is rendered", function() {
      ctx.closePath();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["closePath"]});
    });

  });

  describe("lineTo", function() {

    it("is rendered", function() {
      ctx.lineTo(10, 20);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["lineTo"], doubles: [10, 20]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.lineTo(1);
      }).to.throw("Not enough arguments to CanvasContext.lineTo");
    });

  });

  describe("moveTo", function() {

    it("is rendered", function() {
      ctx.moveTo(10, 20);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["moveTo"], doubles: [10, 20]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.moveTo(1);
      }).to.throw("Not enough arguments to CanvasContext.moveTo");
    });

  });

  describe("bezierCurveTo", function() {

    it("is rendered", function() {
      ctx.bezierCurveTo(1, 2, 3, 4, 5, 6);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["bezierCurveTo"], doubles: [1, 2, 3, 4, 5, 6]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.bezierCurveTo(1, 2, 3, 4, 5);
      }).to.throw("Not enough arguments to CanvasContext.bezierCurveTo");
    });

  });

  describe("quadraticCurveTo", function() {

    it("is rendered", function() {
      ctx.quadraticCurveTo(1, 2, 3, 4);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["quadraticCurveTo"], doubles: [1, 2, 3, 4]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.quadraticCurveTo(1, 2, 3);
      }).to.throw("Not enough arguments to CanvasContext.quadraticCurveTo");
    });

  });

  describe("arc", function() {

    it("is rendered with counterclockwise default", function() {
      ctx.arc(1, 2, 3, 4, 5);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["arc"], doubles: [1, 2, 3, 4, 5], booleans: [false]});
    });

    it("is rendered with counterclockwise parameter", function() {
      ctx.arc(1, 2, 3, 4, 5, true);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["arc"], doubles: [1, 2, 3, 4, 5], booleans: [true]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.arc(1, 2, 3, 4);
      }).to.throw("Not enough arguments to CanvasContext.arc");
    });

  });

  describe("rect", function() {

    it("is rendered", function() {
      ctx.rect(1, 2, 3, 4);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["rect"], doubles: [1, 2, 3, 4]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.rect(1, 2, 3);
      }).to.throw("Not enough arguments to CanvasContext.rect");
    });

  });

  describe("fill", function() {

    it("is rendered", function() {
      ctx.fill();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["fill"]});
    });

  });

  describe("stroke", function() {

    it("is rendered", function() {
      ctx.stroke();
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["stroke"]});
    });

  });

  describe("clearRect", function() {

    it("is rendered", function() {
      ctx.clearRect(10, 20, 30, 40);
      flush();

      expect(decodeLastPacket()).to.eql({ops: ["clearRect"], doubles: [10, 20, 30, 40]});
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.clearRect(1, 2, 3);
      }).to.throw("Not enough arguments to CanvasContext.clearRect");
    });

  });

  describe("fillRect", function() {

    it("is rendered", function() {
      ctx.fillRect(10, 20, 30, 40);
      flush();

      expect(decodeLastPacket()).to.eql({
        ops: ["beginPath", "rect", "fill"],
        doubles: [10, 20, 30, 40]
      });
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.fillRect(1, 2, 3);
      }).to.throw("Not enough arguments to CanvasContext.fillRect");
    });

  });

  describe("strokeRect", function() {

    it("is rendered", function() {
      ctx.strokeRect(10, 20, 30, 40);
      flush();

      expect(decodeLastPacket()).to.eql({
        ops: ["beginPath", "rect", "stroke"],
        doubles: [10, 20, 30, 40]
      });
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.strokeRect(1, 2, 3);
      }).to.throw("Not enough arguments to CanvasContext.strokeRect");
    });

  });

  describe("fillText", function() {

    it("is rendered", function() {
      ctx.fillText("foo", 10, 20);
      flush();

      expect(decodeLastPacket()).to.eql({
        ops: ["fillText"],
        doubles: [10, 20],
        booleans: [false, false, false],
        strings: ["foo"]
      });
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.fillText("foo", 2);
      }).to.throw("Not enough arguments to CanvasContext.fillText");
    });

  });

  describe("strokeText", function() {

    it("is rendered", function() {
      ctx.strokeText("foo", 10, 20);
      flush();

      expect(decodeLastPacket()).to.eql({
        ops: ["strokeText"],
        doubles: [10, 20],
        booleans: [false, false, false],
        strings: ["foo"]
      });
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.strokeText("foo", 2);
      }).to.throw("Not enough arguments to CanvasContext.strokeText");
    });

  });

  describe("createImageData", function() {

    it("creates ImageData from width and height", function() {
      let result = ctx.createImageData(10, 20);

      expect(result).to.be.an.instanceof(ImageData);
      expect(result.width).to.equal(10);
      expect(result.height).to.equal(20);
    });

    it("creates ImageData from ImageData", function() {
      let array = new Uint8ClampedArray(60).fill(128);
      let input = new ImageData(array, 3, 5);

      let result = ctx.createImageData(input);

      expect(result).to.be.an.instanceof(ImageData);
      expect(result.width).to.equal(3);
      expect(result.height).to.equal(5);
      expect(result.data[0]).to.equal(0);
    });

    it("raises error if parameters missing", function() {
      expect(function() {
        ctx.createImageData(10);
      }).to.throw("Not enough arguments to CanvasContext.createImageData");
    });

  });

  describe("getImageData", function() {

    let array;

    beforeEach(function() {
      array = new Uint8ClampedArray(60);
      stub(nativeBridge, "call").returns(array);
    });

    it("is rendered", function() {
      ctx.getImageData(10, 20, 5, 3);

      expect(nativeBridge.call).to.have.been.calledWith(gc.cid, "getImageData", {
        x: 10,
        y: 20,
        width: 5,
        height: 3
      });
    });

    it("returns value from native", function() {
      let result = ctx.getImageData(10, 20, 5, 3);

      expect(result.data).to.eql(array);
    });

    it("raises error if parameters missing", function() {
      expect(function() {
        ctx.getImageData(10, 20, 100);
      }).to.throw("Not enough arguments to CanvasContext.getImageData");
    });

  });

  describe("putImageData", function() {

    let imageData;

    beforeEach(function() {
      imageData = new ImageData(3, 5);
      spy(nativeBridge, "call");
    });

    it("is rendered", function() {
      ctx.putImageData(imageData, 10, 20);

      expect(nativeBridge.call).to.have.been.calledWith(gc.cid, "putImageData", {
        data: imageData.data,
        x: 10,
        y: 20,
        width: 3,
        height: 5
      });
    });

    it("raises error if parameters missing", function() {
      expect(() => {
        ctx.putImageData(imageData, 10);
      }).to.throw("Not enough arguments to CanvasContext.putImageData");
    });

  });

});