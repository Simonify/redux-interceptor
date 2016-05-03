import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import createInterceptor from '../../lib';

const FETCH_DATA = 'FETCH_DATA';
const FETCH_DATA_SUCCESS = 'FETCH_DATA_SUCCESS';
const FETCH_DATA_ERROR = 'FETCH_DATA_ERROR';

function reducer(state = { fetching: false, response: null }, action) {
  switch (action.type) {
    case FETCH_DATA:
      return { ...state, fetching: true };
    case FETCH_DATA_SUCCESS:
      return { ...state, fetching: false, response: action.payload };
    case FETCH_DATA_ERROR:
      return { ...state, fetching: false, response: null, error: action.payload };
    default:
      return state;
  }
}

const fetchWithSuccess = () => (dispatch) => {
  dispatch({ type: FETCH_DATA });

  return new Promise((resolve) => {
    setTimeout(() => {
      dispatch({ type: FETCH_DATA_SUCCESS, payload: Date.now() });
      resolve();
    }, 2000);
  });
};

const fetchWithError = () => (dispatch) => {
  dispatch({ type: FETCH_DATA });

  return new Promise((resolve) => {
    setTimeout(() => {
      dispatch({ type: FETCH_DATA_ERROR, payload: new Error('oh no!'), error: true });
      resolve();
    }, 2000);
  });
};

const interceptor = createInterceptor();
const store = createStore(
  reducer,
  applyMiddleware(interceptor, thunk)
);

store.dispatch(fetchWithSuccess());

console.log('#fetchWithSuccess dispatched', store.getState());

interceptor.resolve().then(() => {
  console.log('All actions resolved', store.getState());

  interceptor.reset();

  console.log('Interceptor reset', store.getState());

  store.dispatch(fetchWithError());

  console.log('#fetchWithError dispatched', store.getState());

  interceptor.resolve().then(() => {
    console.log('All actions resolved', store.getState());
  });
});
