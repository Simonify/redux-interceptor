export default function createInterceptorMiddleware() {
  let actions = [];
  let promises = [];
  let active = true;
  let resolved = false;

  function trackAction(exec) {
    if (typeof exec.then === 'function') {
      const untrack = () => {
        const index = promises.indexOf(exec);

        if (index > -1) {
          promises.splice(index, 1);
        }
      };

      promises.push(exec);
      exec.then(untrack, untrack);
    }

    return exec;
  }

  function execAction({ resolve: _resolve, reject, next, action }) {
    const exec = next(action);

    if (typeof exec.then === 'function') {
      return trackAction(exec).then(_resolve, reject);
    }

    return Promise.resolve(exec);
  }

  function handleActions(followChain = true) {
    const deferHandleActions = () => new Promise((resolve, reject) => (
      setTimeout(() => (
        handleActions().then(
          () => setTimeout(resolve, 0),
          () => setTimeout(reject, 0)
        )
      ), 0)
    ));

    if (!actions.length) {
      if (!promises.length) {
        active = false;
        return Promise.resolve();
      }

      return Promise.all(promises).then(deferHandleActions, deferHandleActions);
    }

    actions.map(execAction);

    let promise = Promise.all(promises);

    actions = [];
    promises = [];

    if (followChain) {
      promise = promise.then(deferHandleActions, deferHandleActions);
    } else {
      active = false;
    }

    return promise;
  }

  function resolve({ followChain = true } = {}) {
    if (resolved) {
      return Promise.reject(new Error('the interceptor was already resolved'));
    }

    resolved = true;

    return handleActions(followChain);
  }

  function reset() {
    actions = [];
    promises = [];
    active = true;
    resolved = false;
  }

  const middleware = () => next => action => {
    if (action.type && action.type.substr(0, 2) === '@@') { // allow internal actions
      return next(action);
    }

    if (resolved) {
      if (!active) {
        return next(action);
      }

      return trackAction(next(action));
    }

    return new Promise((_resolve, reject) => {
      actions.push({ resolve: _resolve, reject, next, action });
    });
  };

  Object.assign(middleware, { reset, resolve });

  return middleware;
}
