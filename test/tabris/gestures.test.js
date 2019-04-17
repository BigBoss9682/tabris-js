import Widget from '../../src/tabris/Widget';
import ClientMock from './ClientMock';
import {expect, mockTabris, spy, restore} from '../test';

describe('gestures:', function() {

  class TestType extends Widget {
    get _nativeType() {
      return 'TestType';
    }
  }

  let client, widget;

  beforeEach(function() {
    client = new ClientMock();
    mockTabris(client);
  });

  afterEach(restore);

  function gestureCreate() {
    return client.calls({op: 'create', type: 'tabris.GestureRecognizer'});
  }

  function widgetCreate() {
    return client.calls({op: 'create', type: 'TestType'});
  }

  it('getter returns object with pre-configured gestures as initial value', function() {
    const gestures = new TestType().gestures;
    expect(gestures.tap).to.eql({type: 'tap'});
    expect(gestures.longPress).to.eql({type: 'longPress'});
  });

  describe('setting single gesture', function() {

    beforeEach(function() {
      widget = new TestType({
        gestures: {foo: {type: 'tap', fingers: 2}}
      });

    });

    it('does not SET property', function() {
      expect(widgetCreate()[0].properties.gestures).to.be.undefined;
    });

    it('does not CREATE GestureRecognizer', function() {
      expect(gestureCreate().length).to.equal(0);
    });

    it('extends pre-configured gestures', function() {
      expect(widget.gestures.foo).to.eql({type: 'tap', fingers: 2});
      expect(widget.gestures.tap).to.eql({type: 'tap'});
    });

    it('prevents overwriting global default gestures', function() {
      const defaultGestures = new TestType().gestures;
      defaultGestures.tap = false;
      expect(new TestType().gestures.tap).to.eql({type: 'tap'});
    });

    it('allows overwriting pre-configured gestures', function() {
      widget.gestures = {tap: {type: 'tap', touches: 2}};
      expect(widget.gestures.tap).to.eql({type: 'tap', touches: 2});
    });

    describe('and adding matching gesture listener', function() {

      const listener = function() {};

      beforeEach(function() {
        widget.on('foo', listener);
      });

      it('CREATEs GestureRecognizer', function() {
        expect(gestureCreate().length).to.equal(1);
      });

      it('CREATEs GestureRecognizer with type', function() {
        expect(gestureCreate()[0].properties.type).to.equal('tap');
      });

      it('CREATEs GestureRecognizer with target', function() {
        expect(gestureCreate()[0].properties.target).to.equal(widget.cid);
      });

      it('CREATEs GestureRecognizer with configuration properties', function() {
        expect(gestureCreate()[0].properties.fingers).to.equal(2);
      });

      it('GestureRecognizer LISTENs to gesture events', function() {
        const call = client.calls({op: 'listen', id: gestureCreate()[0].id, event: 'gesture'})[0];
        expect(call.listen).to.equal(true);
      });

      it('disposing widget disposes existing GestureRecognizer', function() {
        widget.dispose();

        expect(client.calls({op: 'destroy', id: gestureCreate()[0].id}).length).to.equal(1);
      });

      describe('multiple times', function() {

        beforeEach(function() {
          widget.on('foo', function() {
          });
        });

        it('CREATEs only one GestureRecognizer', function() {
          expect(gestureCreate().length).to.equal(1);
        });

      });

      describe(', then notifying the recognizer', function() {

        it('triggers matching widget event', function() {
          const listener = spy();
          widget.on('foo', listener);

          tabris._notify(gestureCreate()[0].id, 'gesture', {});

          expect(listener).to.have.been.called;
        });

        it('forwards event object', function() {
          const listener = spy();
          widget.on('foo', listener);

          tabris._notify(gestureCreate()[0].id, 'gesture', {state: 'recognized'});

          expect(listener).to.have.been.calledOnce;
          expect(listener).to.have.been.calledWithMatch({target: widget, state: 'recognized'});
        });

      });

      describe(', then removing all listener', function() {

        beforeEach(function() {
          widget.off('foo', listener);
        });

        it('disposes matching GestureRecognizer', function() {
          expect(client.calls({op: 'destroy', id: gestureCreate()[0].id}).length).to.equal(1);
        });

      });

    });

  });

  describe('listening to multiple gestures', function() {

    const barListener = function() {};

    beforeEach(function() {
      widget = new TestType({
        gestures: {foo: {type: 'tap', fingers: 2}, bar: {type: 'pan', fingers: 3}}
      });
      widget.on('foo', function() {}).on('bar', function() {});
    });

    it('CREATEs multiple GestureRecognizers', function() {
      expect(gestureCreate().length).to.equal(2);
    });

    it('disposing widget disposes all GestureRecognizers', function() {
      widget.dispose();

      expect(client.calls({op: 'destroy', id: gestureCreate()[0].id}).length).to.equal(1);
      expect(client.calls({op: 'destroy', id: gestureCreate()[1].id}).length).to.equal(1);
    });

    it('disposing widget disposes all remaining GestureRecognizers', function() {
      widget.off('bar', barListener);
      widget.dispose();

      expect(client.calls({op: 'destroy', id: gestureCreate()[0].id}).length).to.equal(1);
      expect(client.calls({op: 'destroy', id: gestureCreate()[1].id}).length).to.equal(1);
    });

  });

  describe('when no gestures are configured', function() {

    beforeEach(function() {
      widget = new TestType();
    });

    it('ignores removing a gesture listener (see #368)', function() {
      expect(() => {
        widget.off('pan', function() {});
      }).to.not.throw();
    });

  });

  // TODO: test setting invalid gestures values
  // TODO: test setting invalid gestures configuration (not object, no type)

});
