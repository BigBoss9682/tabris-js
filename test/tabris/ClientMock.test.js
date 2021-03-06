import {expect, mockTabris, restore} from '../test';
import ClientMock from './ClientMock';
import CheckBox from '../../src/tabris/widgets/CheckBox';
import TextInput from '../../src/tabris/widgets/TextInput';
import Tabris from '../../src/tabris/Tabris';
import {create as createDevice} from '../../src/tabris/Device';

describe('ClientMock', function() {

  let client;

  beforeEach(function() {
    client = new ClientMock();
    mockTabris(client);
  });

  afterEach(restore);

  describe('calls', function() {

    it('returns empty list by default', function() {
      expect(client.calls().length).to.equal(0);
    });

    describe('returns recorded calls', function() {

      it('create', function() {
        const props = {};
        client.create('id', 'type', props);

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'create',
          id: 'id',
          type: 'type',
          properties: props
        });
      });

      it('get', function() {
        client.get('id', 'prop');

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'get',
          id: 'id',
          property: 'prop'
        });
      });

      it('set', function() {
        const props = {};
        client.set('id', props);

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'set',
          id: 'id',
          properties: props
        });
      });

      it('call', function() {
        const params = {};
        client.call('id', 'method', params);

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'call',
          id: 'id',
          method: 'method',
          parameters: params
        });
      });

      it('listen', function() {
        client.listen('id', 'event', true);

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'listen',
          id: 'id',
          event: 'event',
          listen: true
        });
      });

      it('destroy', function() {
        client.destroy('id');

        const call = client.calls()[0];
        expect(call).to.deep.equal({
          op: 'destroy',
          id: 'id'
        });
      });

      describe('after multiple calls', function() {

        beforeEach(function() {
          client.create('id1', 'type1', {foo: 1});
          client.create('id2', 'type2', {foo: 2});
          client.set('id1', {bar: 1});
          client.set('id2', {bar: 2});
        });

        it('returns all calls', function() {
          expect(client.calls().length).to.equal(4);
        });

        it('result list can be filtered', function() {
          expect(client.calls({id: 'id1'}).length).to.equal(2);
        });

      });

    });

  });

  describe('properties', function() {

    it('throws with unknown object id', function() {
      expect(() => client.properties('foo')).to.throw(Error, 'No object with id foo');
    });

    it('returns properties after create', function() {
      client.create('w1', 'widget', {foo: 23});
      expect(client.properties('w1')).to.deep.equal({foo: 23});
    });

    it('returns properties after set', function() {
      client.set('w1', {foo: 23});
      expect(client.properties('w1')).to.deep.equal({foo: 23});
    });

    it('aggregates properties after multiple calls', function() {
      client.create('w1', 'widget', {foo: 23, bar: 42});
      client.set('w1', {bar: 47, baz: 11});
      expect(client.properties('w1')).to.deep.equal({foo: 23, bar: 47, baz: 11});
    });

    it('removes properties after destroy', function() {
      client.create('w1', 'widget', {foo: 23, bar: 42});
      client.destroy('w1');
      expect(() => client.properties('w1')).to.throw(Error, 'No object with id w1');
    });

    it('initializes with defaults', function() {
      client = new ClientMock({
        'tabris.App': {appId: 'foo'},
        'tabris.Device': {model: 'bar'}
      });

      client.create('$1', 'tabris.App', {});
      client.create('$2', 'tabris.Device', {});

      expect(client.get('$1', 'appId')).to.equal('foo');
      expect(client.properties('$1')).to.deep.equal({appId: 'foo'});
      expect(client.get('$2', 'model')).to.equal('bar');
      expect(client.properties('$2')).to.deep.equal({model: 'bar'});
    });

  });

  describe('resetCalls', function() {

    beforeEach(function() {
      client.create('id1', 'type1', {foo: 1});
      client.set('id1', {bar: 2});
      client.resetCalls();
    });

    it('clears calls', function() {
      expect(client.calls().length).to.equal(0);
    });

    it('retains properties', function() {
      expect(client.properties('id1')).to.deep.equal({foo: 1, bar: 2});
    });

  });

  describe('client emulation', function() {

    it('get returns properties from create', () => {
      client.create('id1', 'test.Type', {foo: 'value'});

      expect(client.get('id1', 'foo')).to.equal('value');
    });

    it('get returns properties from set', () => {
      client.set('id1', {foo: 'value'});

      expect(client.get('id1', 'foo')).to.equal('value');
    });

    it('get returns properties from create and set', () => {
      client.create('id1', 'test.Type', {foo: 'value1', bar: 'value1'});
      client.set('id1', {bar: 'value2', baz: 'value2'});

      expect(client.get('id1', 'foo')).to.equal('value1');
      expect(client.get('id1', 'bar')).to.equal('value2');
      expect(client.get('id1', 'baz')).to.equal('value2');
    });

    it('get returns properties modified directly', () => {
      client.create('id1', 'test.Type', {foo: 'value1', bar: 'value1'});
      client.properties('id1').bar = 'value2';

      expect(client.get('id1', 'bar')).to.equal('value2');
    });

    it('integrates with tabris object', function() {
      client = new ClientMock({'tabris.Device': {platform: 'Android'}});
      global.tabris = new Tabris();
      global.tabris._init(client, {});
      const checkBox = new CheckBox({});
      client.properties(checkBox.cid).checked = true;
      const textInput = new TextInput({text: 'foo'});

      expect(createDevice().platform).to.equal('Android');
      expect(checkBox.bounds).to.deep.equal({left: 0, top: 0, width: 0, height: 0});
      expect(checkBox.checked).to.be.true;
      expect(textInput.text).to.equal('foo');
    });

  });

});
