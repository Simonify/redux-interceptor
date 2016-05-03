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
import React, { Component, PropTypes } from 'react';
import { renderToString } from 'react-dom/server';
import { applyMiddleware, createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import thunk from 'redux-thunk';
import createInterceptor from 'redux-interceptor';

const FETCH_RANDOM = 'example/FETCH_RANDOM';
const SET_RANDOM = 'example/SET_RANDOM';

const fetchRandom = () => dispatch => {
  dispatch({ type: FETCH_RANDOM });

  return new Promise((resolve) => setTimeout(() => resolve(dispatch({
    type: SET_RANDOM,
    payload: Math.random()
  })), 2500));
}

function reducer(state = { fetching: false, random: null }, action) {
  switch (action.type) {
    case FETCH_RANDOM:
      return { ...state, fetching: true, random: null };
    case SET_RANDOM:
      return { ...state, fetching: false, random: action.payload };
    default:
      return state;
  }
}

class App extends Component {
  static propTypes = {
    fetchRandom: PropTypes.func.isRequired,
    random: PropTypes.number
  };

  componentWillMount() {
    if (typeof this.props.random !== 'number') {
      this.props.fetchRandom();
    }
  }

  render() {
    return (
      <div>
        {typeof this.props.random === 'number' ? this.props.random : 'Loading...'}
      </div>
    );
  }
}

const interceptor = createInterceptor();
const store = createStore(reducer, applyMiddleware(interceptor, thunk));
const ConnectedApp = connect(({ random }) => ({ random }), { fetchRandom })(App);
const render = () => renderToString((
  <Provider store={store}>
    <ConnectedApp />
  </Provider>
));

// <div data-reactroot="" data-reactid="1" data-react-checksum="622727842">Loading...</div>
console.log(render());

// <div data-reactroot="" data-reactid="1" data-react-checksum="-1584000246">0.9193182914256697</div>
interceptor.resolve().then(render).then(::console.log);
```
