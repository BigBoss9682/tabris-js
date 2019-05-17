import {Composite, contentView} from 'tabris';

const PORTRAIT = {
  '#red': {layoutData: {left: 16, top: 16, right: 16, height: 192}},
  '#green': {layoutData: {left: 16, top: '#red 16', right: 16, bottom: 16}}
};

const LANDSCAPE = {
  '#red': {layoutData: {left: 16, top: 16, bottom: 16, width: 192}},
  '#green': {layoutData: {left: '#red 16', top: 16, right: 16, bottom: 16}}
};

contentView.append(
  <$>
    <Composite id='red' background='red'/>
    <Composite id='green' background='green'/>
  </$>
);

contentView.onResize(applyLayout);
applyLayout();

function applyLayout() {
  const {width, height} = contentView.bounds;
  contentView.apply(height > width ? PORTRAIT : LANDSCAPE);
}
