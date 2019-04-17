import {expect, spy, stub, restore} from '../test';
import NativeObject from '../../src/tabris/NativeObject';
import ClientInterface from '../../src/tabris/Tabris';
import {create as createContentView} from '../../src/tabris/widgets/ContentView';
import ClientMock from './ClientMock';
import '../../src/tabris/Tabris';

describe('ClientInterface', function() {

  let tabris;
  let client;

  beforeEach(function() {
    tabris = global.tabris = new ClientInterface();
    client = new ClientMock();
  });

  afterEach(restore);

  describe('_init', function() {

    it('can be called without a context', function() {
      expect(() => {
        tabris._init.call(null, client);
      }).to.not.throw();
    });

    it('triggers start event', function() {
      const listener = spy();
      tabris.on('start', listener);

      tabris._init.call(null, client);

      expect(listener).to.have.been.calledOnce;
    });

    it('triggers start event when tabris is set up', function() {
      class TestType extends NativeObject {
        get _nativeType() { return 'test.Type'; }
      }
      tabris.on('start', () => new TestType());

      tabris._init.call(null, client);

      expect(client.calls({op: 'create', type: 'test.Type'}).length).to.equal(1);
    });

  });

  describe('contentView', function() {

    beforeEach(function() {
      tabris._init(client);
    });

    it('can be set only once', function() {
      const contentView = tabris.contentView = createContentView();

      tabris.contentView = null;

      expect(tabris.contentView).to.equal(contentView);
    });

    it('SETs contentView', function() {
      const contentView = tabris.contentView = createContentView();

      expect(client.calls({op: 'set', id: tabris.cid})[0].properties)
        .to.deep.equal({contentView: contentView.cid});
    });

  });

  describe('_notify', function() {

    class TestType extends NativeObject {
      get _nativeType() { return 'test.Type'; }
    }
    let widget;

    beforeEach(function() {
      tabris._init(client);
      widget = new TestType();
    });

    it('notifies widget', function() {
      spy(widget, '_trigger');

      tabris._notify(widget.cid, 'foo', {bar: 23});

      expect(widget._trigger).to.have.been.calledWith('foo', {bar: 23});
    });

    it('returns return value from widget', function() {
      stub(widget, '_trigger').callsFake(() => 'result');

      const result = tabris._notify(widget.cid, 'foo');

      expect(result).to.equal('result');
    });

    it('skips events for already disposed widgets', function() {
      widget.dispose();
      spy(widget, '_trigger');

      tabris._notify(widget.cid, 'foo', {bar: 23});

      expect(widget._trigger).to.have.not.been.called;
    });

    it('silently ignores events for non-existing ids (does not crash)', function() {
      expect(() => {
        tabris._notify('no-id', 'foo', {bar: 23});
      }).to.not.throw();
    });

    it('can be called without a context', function() {
      spy(widget, '_trigger');

      tabris._notify.call(null, widget.cid, 'foo', [23, 42]);

      expect(widget._trigger).to.have.been.calledWith('foo', [23, 42]);
    });

  });

});
