export function delay<T>(ms: number | null) {
  return async (value: T) => {
    if (!ms) {
      await new Promise(() => {
        // never resolve
      });
    } else {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
    return value;
  };
}
