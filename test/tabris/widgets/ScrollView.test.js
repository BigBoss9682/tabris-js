import {expect, mockTabris, restore, spy, stub} from '../../test';
import ClientStub from '../ClientStub';
import ScrollView from '../../../src/tabris/widgets/ScrollView';
import Composite from '../../../src/tabris/widgets/Composite';

describe('ScrollView', function() {

  let client, scrollView;

  let checkListen = function(event) {
    let listen = client.calls({op: 'listen', id: scrollView.cid});
    expect(listen.length).to.equal(1);
    expect(listen[0].event).to.equal(event);
    expect(listen[0].listen).to.equal(true);
  };

  beforeEach(function() {
    client = new ClientStub();
    mockTabris(client);
  });

  afterEach(restore);

  describe('when a ScrollView is created', function() {

    beforeEach(function() {
      scrollView = new ScrollView();
    });

    it('defaults to vertical direction', function() {
      expect(scrollView.direction).to.equal('vertical');
    });

    describe('when a child is appended', function() {

      let result, child;

      beforeEach(function() {
        child = new Composite();
        client.resetCalls();
        result = scrollView.append(child);
      });

      it("sets child's parent to scrollView", function() {
        let call = client.calls({op: 'set', id: child.cid})[0];
        expect(call.properties.parent).to.equal(scrollView.cid);
      });

      it('returns self to allow chaining', function() {
        expect(result).to.equal(scrollView);
      });

    });

  });

  describe("when created with direction 'vertical'", function() {

    let createCalls;

    beforeEach(function() {
      scrollView = new ScrollView({direction: 'vertical'});
      createCalls = client.calls({op: 'create'});
      client.resetCalls();
    });

    it('creates a vertical ScrolledView', function() {
      expect(createCalls[0].properties.direction).to.equal('vertical');
      expect(scrollView.direction).to.equal('vertical');
    });

    it('offsetY is taken from native', function() {
      stub(client, 'get').returns(42);
      expect(scrollView.offsetY).to.equal(42);
    });

    it('offsetY can not be set', function() {
      stub(console, 'warn');
      scrollView.offsetY = 23;

      let setCalls = client.calls({id: scrollView.cid, op: 'set'});

      expect(setCalls.length).to.equal(0);
    });

    it('fires scroll event', function() {
      let listener = spy();
      scrollView.on('scrollY', listener);

      tabris._notify(scrollView.cid, 'scrollY', {offset: 42});

      checkListen('scrollY');
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWithMatch({target: scrollView, offset: 42});
    });

    it('fires offsetYChanged event', function() {
      let listener = spy();
      scrollView.on('offsetYChanged', listener);

      tabris._notify(scrollView.cid, 'scrollY', {offset: 42});

      checkListen('scrollY');
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWithMatch({target: scrollView, value: 42});
    });

    it('does not fire offsetXChanged event', function() {
      let listener = spy();
      scrollView.on('offsetXChanged', listener);

      tabris._notify(scrollView.cid, 'scrollY', {offset: 42});

      expect(listener).not.to.have.been.called;
    });

  });

  describe("when created with direction 'horizontal'", function() {

    let createCalls;

    beforeEach(function() {
      scrollView = new ScrollView({direction: 'horizontal'});
      createCalls = client.calls({op: 'create'});
      client.resetCalls();
    });

    it('creates a horizontal ScrollView', function() {
      expect(createCalls[0].properties.direction).to.equal('horizontal');
      expect(scrollView.direction).to.equal('horizontal');
    });

    it('offsetX is taken from native', function() {
      stub(client, 'get').returns(23);
      expect(scrollView.offsetX).to.equal(23);
    });

    it('offsetX can not be set', function() {
      stub(console, 'warn');
      scrollView.offsetX = 23;

      let setCalls = client.calls({id: scrollView.cid, op: 'set'});

      expect(setCalls.length).to.equal(0);
    });

    it('fires scrollX event', function() {
      let listener = spy();
      scrollView.on('scrollX', listener);

      tabris._notify(scrollView.cid, 'scrollX', {offset: 42});

      checkListen('scrollX');
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWithMatch({target: scrollView, offset: 42});
    });

    it('fires offsetXChanged event', function() {
      let listener = spy();
      scrollView.on('offsetXChanged', listener);

      tabris._notify(scrollView.cid, 'scrollX', {offset: 42});

      checkListen('scrollX');
      expect(listener).to.have.been.calledOnce;
      expect(listener).to.have.been.calledWithMatch({target: scrollView, value: 42});
    });

    it('does not fire offsetYChanged event', function() {
      let listener = spy();
      scrollView.on('offsetYChanged', listener);

      tabris._notify(scrollView.cid, 'scrollX', {offset: 42});

      expect(listener).not.to.have.been.called;
    });

  });

  describe('when scrollToX is invoked', function() {

    beforeEach(function() {
      scrollView = new ScrollView();
    });

    it('returns ScrollView', function() {
      expect(scrollView.scrollToX(100)).to.equal(scrollView);
    });

    it("CALLs 'scrollToX' with default options", function() {
      scrollView.scrollToX(100);

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToX',
        parameters: {
          offset: 100,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToX' with options", function() {
      scrollView.scrollToX(101, {animate: false});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToX',
        parameters: {
          offset: 101,
          animate: false
        }
      }]);
    });

    it("CALLs 'scrollToX' with normalized options", function() {
      scrollView.scrollToX(101, {animate: 1});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToX',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToX' with filtered options", function() {
      scrollView.scrollToX(101, {foo: 'bar', animate: true});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToX',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToX' with autocompleted options", function() {
      scrollView.scrollToX(101, {});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToX',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

  });

  describe('when scrollToY is invoked', function() {

    beforeEach(function() {
      scrollView = new ScrollView();
    });

    it('returns ScrollView', function() {
      expect(scrollView.scrollToY(100)).to.equal(scrollView);
    });

    it("CALLs 'scrollToY' with default options", function() {
      scrollView.scrollToY(100);

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToY',
        parameters: {
          offset: 100,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToY' with options", function() {
      scrollView.scrollToY(101, {animate: false});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToY',
        parameters: {
          offset: 101,
          animate: false
        }
      }]);
    });

    it("CALLs 'scrollToY' with normalized options", function() {
      scrollView.scrollToY(101, {animate: 1});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToY',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToY' with filtered options", function() {
      scrollView.scrollToY(101, {foo: 'bar', animate: true});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToY',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

    it("CALLs 'scrollToY' with autocompleted options", function() {
      scrollView.scrollToY(101, {});

      let calls = client.calls({op: 'call', id: scrollView.cid});
      expect(calls).to.deep.equal([{
        op: 'call',
        id: scrollView.cid,
        method: 'scrollToY',
        parameters: {
          offset: 101,
          animate: true
        }
      }]);
    });

  });

  describe('scrollXState', function() {

    beforeEach(function() {
      scrollView = new ScrollView();
    });

    it('it returns value from native', function() {
      stub(client, 'get').returns('rest');
      expect(scrollView.scrollXState).to.equal('rest');
    });

    it('it calls listen for scrollXStateChanged when change event registered', function() {
      scrollView.on('scrollXStateChanged', function() {});

      const calls = client.calls({id: scrollView.cid, op: 'listen', event: 'scrollXStateChanged'});
      expect(calls[0].listen).to.equal(true);
    });

  });

  describe('scrollYState', function() {

    beforeEach(function() {
      scrollView = new ScrollView();
    });

    it('it returns value from native', function() {
      stub(client, 'get').returns('rest');
      expect(scrollView.scrollYState).to.equal('rest');
    });

    it('it calls listen for scrollYStateChanged when change event registered', function() {
      scrollView.on('scrollYStateChanged', function() {});

      const calls = client.calls({id: scrollView.cid, op: 'listen', event: 'scrollYStateChanged'});
      expect(calls[0].listen).to.equal(true);
    });

  });

});
