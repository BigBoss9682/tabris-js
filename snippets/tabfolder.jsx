import {contentView, Tab, TabFolder, TextView} from 'tabris';

contentView.append(
  <TabFolder paging stretch selectionIndex={1} tabBarLocation='bottom'>
    <Tab title='Cart' image='resources/cart@2x.png' selectedImage='resources/cart-filled@2x.png'>
      <TextView centerX centerY>Content of Tab Cart</TextView>
    </Tab>
    <Tab title='Pay' image='resources/card@2x.png' selectedImage='resources/card-filled@2x.png' badge={5}>
      <TextView centerX centerY>Content of Tab Cart</TextView>
    </Tab>
    <Tab title='Statistic' image='resources/chart@2x.png' selectedImage='resources/chart-filled@2x.png'>
      <TextView centerX centerY>Content of Tab Cart</TextView>
    </Tab>
  </TabFolder>
);
