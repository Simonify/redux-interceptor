export default function createInterceptorMiddleware() {
  let actions = [];
  let resolved = false;

  function resolve() {
    if (resolved) {
      return Promise.reject(new Error('the interceptor was already resolved'));
    }

    resolved = true;

    if (!actions.length) {
      return Promise.resolve();
    }

    const promise = Promise.all(actions.map(({ resolve: _resolve, reject, next, action }) => {
      const exec = next(action);

      if (typeof exec.then === 'function') {
        exec.then(_resolve, reject);
        return exec;
      }

      return Promise.resolve(exec);
    }));

    actions = [];

    return promise;
  }

  function reset() {
    actions = [];
    resolved = false;
  }

  const middleware = () => next => action => {
    if (resolved || (action.type && action.type.substr(0, 2) === '@@')) { // allow internal actions
      return next(action);
    }

    return new Promise((_resolve, reject) => {
      actions.push({ resolve: _resolve, reject, next, action });
    });
  };

  Object.assign(middleware, { reset, resolve });

  return middleware;
}
