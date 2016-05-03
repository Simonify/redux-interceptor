# redux-interceptor

`redux-interceptor` is a middleware for intercepting Redux actions and deferring their execution to a later time.

## Install
`npm install redux-interceptor --save`

## Usage
```js
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise';
import createInterceptor from 'redux-interceptor';

const interceptor = createInterceptor();
const store = createStore(
  reducer,
  applyMiddleware(interceptor, thunk, promise)
);
```

You **must** attach interceptor before thunk/promise middleware so that it can correctly capture promises.

## API

`redux-interceptor` exports a single function for creating the middleware:

```js
createInterceptor() => InterceptorMiddleware
```

The returned middleware provides a function for dispatching all recorded actions:

`InterceptorMiddleware.resolve() => Promise`

The promise returned will resolve when all of the actions have resolved, or rejects with the reason of the first action that fails.

## Usage with React for asynchronous renders:

```js
import Render, { renderToString } from 'react';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import promise from 'redux-promise';
import createInterceptor from 'redux-interceptor';
import App from 'components/app';

const render() => renderToString(<App />);
const interceptor = createInterceptor();
const store = createStore(
  reducer,
  applyMiddleware(thunk, promise, interceptor)
);

render();

return interceptor.resolve().then(render);
```
