import {expect, mockTabris, restore, stub} from '../../test';
import ClientMock from '../ClientMock';
import NavigationView from '../../../src/tabris/widgets/NavigationView';
import Page from '../../../src/tabris/widgets/Page';
import Composite from '../../../src/tabris/widgets/Composite';
import {toXML} from '../../../src/tabris/Console';

describe('Page', function() {

  let client;
  let parent;
  let page;

  beforeEach(function() {
    client = new ClientMock();
    mockTabris(client);
    parent = new NavigationView();
    client.resetCalls();
    page = new Page();
  });

  afterEach(restore);

  it('is created', function() {
    const createCalls = client.calls({op: 'create'});
    expect(createCalls.length).to.equal(1);
    expect(createCalls[0].type).to.equal('tabris.Page');
  });

  it('set SETs properties', function() {
    client.resetCalls();
    page.set({
      title: 'title',
      image: {src: 'image'},
      background: 'red'
    });

    const setCalls = client.calls({op: 'set'});
    expect(setCalls.length).to.equal(1);
    expect(setCalls[0].properties.title).to.equal('title');
    expect(setCalls[0].properties.image).to.deep.equal({
      type: 'uri',
      src: 'image',
      width: null, height: null, scale: null
    });
    expect(setCalls[0].properties.background).to.deep.equal({type: 'color', color: [255, 0, 0, 255]});
  });

  it('get returns default values', function() {
    expect(page.title).to.equal('');
    expect(page.image).to.be.null;
    expect(page.background.toString()).to.equal('initial');
  });

  it('supports children', function() {
    const child = new Composite();
    client.resetCalls();
    page.append(child);
    tabris.flush();

    const call = client.calls({op: 'set', id: page.cid})[0];
    expect(call.properties.children).to.deep.equal([child.cid]);
  });

  it('prevents insertBefore', function() {
    page.appendTo(parent);
    expect(() => {
      new Page().insertBefore(page);
    }).to.throw(Error, 'insertBefore not supported on Page');
  });

  it('prevents insertAfter', function() {
    page.appendTo(parent);
    expect(() => {
      new Page().insertAfter(page);
    }).to.throw(Error, 'insertAfter not supported on Page');
  });

  it('throws when appended to an illegal parent', function() {
    expect(() => {
      page.appendTo(new Composite());
    }).to.throw(Error, 'Page could not be appended to Composite');
  });

  it('toXML prints xml element with title', function() {
    stub(client, 'get').returns({});
    expect(page.set({title: 'foo'})[toXML]()).to.match(
      /<Page .* title='foo'\/>/
    );
  });

});
