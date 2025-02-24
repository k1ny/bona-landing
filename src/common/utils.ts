export const throttle = <T extends (...args: any[]) => void>(
  fn: T,
  timeout: number,
) => {
  let availableToExecute = true;

  return (...args: Parameters<T>) => {
    if (!availableToExecute) {
      return;
    }

    availableToExecute = false;
    fn(...args);

    setTimeout(() => {
      availableToExecute = true;
    }, timeout);
  };
};
