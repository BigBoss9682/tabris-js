declare namespace JSX {

  type JsxFactory = (
    this: tabris.JsxProcessor,
    type: {new (...args: any[]): any },
    attributes: object
  ) => Element;

  type Element = any;

  const jsxFactory: unique symbol;
  const jsxType: unique symbol;

  function createElement(type: Function|string, attributes: object, ...children: Array<ElementClass>): ElementClass;

  function install(jsxProcessor: tabris.JsxProcessor): void;

  interface ElementClass {
    jsxAttributes?: object;
    [JSX.jsxFactory]: JsxFactory;
  }

  interface ElementAttributesProperty {
    jsxAttributes: any;
  }

  interface ElementChildrenAttribute {
    children?: any;
  }

  interface IntrinsicElements {
    br: {children?: never};
    b: {children?: string|string[]};
    span: {children?: string|string[]};
    big: {children?: string|string[]};
    i: {children?: string|string[]};
    small: {children?: string|string[]};
    strong: {children?: string|string[]};
    ins: {children?: string|string[]};
    del: {children?: string|string[]};
    a: {href?: string, children?: string|string[]};
  }

}
