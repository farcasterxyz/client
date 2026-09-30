const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export { sleep };
