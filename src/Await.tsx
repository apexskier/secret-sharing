import React from "react";

interface AwaitPromise<T> {
  read(): T;
}

function wrapPromise<T>(promise: Promise<T>): AwaitPromise<T> {
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

function useAwaitPromise<T>(promise: Promise<T>): AwaitPromise<T> {
  return React.useMemo(() => wrapPromise(promise), [promise]);
}

interface AwaitProps<T> {
  promise: Promise<T>;
  then(data: T): JSX.Element;
  catch(error: unknown): JSX.Element;
  children: React.ReactNode;
}

// Await is a react component that suspends until the promise has completed
// loading. While loading, it falls back to children. When resolved, `then` is
// rendered with the result of the promise. If the promise throws an error,
// `catch` is rendered with the error.
//
// Do not modify react state within your promise, as the component is not
// mounted yet!
export function Await<T>({
  promise: resource,
  then: onResolve,
  catch: onReject,
  children,
}: AwaitProps<T>) {
  return (
    <React.Suspense fallback={children}>
      <AwaitInner
        resource={useAwaitPromise(resource)}
        onReject={onReject}
        onResolve={onResolve}
      />
    </React.Suspense>
  );
}

interface AwaitInnerProps<T> {
  resource: AwaitPromise<T>;
  onResolve(data: T): JSX.Element;
  onReject(error: unknown): JSX.Element;
}

// Await is a react component that suspend until the resource has completed
// loading. If the resource throws an error, this component will throw it (so
// add an error boundary if you wish to handle it).
function AwaitInner<T>({ resource, onReject, onResolve }: AwaitInnerProps<T>) {
  try {
    return onResolve(resource.read());
  } catch (e) {
    if (e instanceof Promise) {
      throw e;
    }
    console.error(e);
    return onReject(e);
  }
}
