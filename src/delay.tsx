function delay<T>(ms: number) {
  return async (value: T) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return value;
  };
}
