const isUsernameValid = (username: string) =>
  username.length > 0 && /^[a-z0-9][a-z0-9-]{0,15}$/gm.test(username);

export { isUsernameValid };
