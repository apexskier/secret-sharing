import React from "react";

interface SuspensePromise<T> {
  read(): T;
}

function wrapPromise<T>(promise: Promise<T>): SuspensePromise<T> {
  let status = "pending";
  let response: T;

  const suspender = promise.then(
    async (res) => {
      status = "success";
      response = res;
    },
    async (err) => {
      status = "error";
      response = err;
    }
  );

  return {
    read() {
      switch (status) {
        case "pending":
          throw suspender;
        case "error":
          throw response;
        default:
          return response;
      }
    },
  };
}

export function useSuspensePromise<T>(promise: Promise<T>): SuspensePromise<T> {
  return React.useMemo(() => wrapPromise(promise), [promise]);
}

interface AwaitProps<T> {
  resource: SuspensePromise<T>;
  children(data: T): JSX.Element;
  onError(error: unknown): JSX.Element;
}

// Await is a react component that suspend until the resource has completed
// loading. If the resource throws an error, this component will throw it (so
// add an error boundary if you wish to handle it).
export function Await<T>({ resource, onError, children }: AwaitProps<T>) {
  try {
    return children(resource.read());
  } catch (e) {
    if (e instanceof Promise) {
      throw e;
    }
    console.error(e);
    return onError(e);
  }
}
