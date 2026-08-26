const validateDisplayName = (displayName: string) => {
  const trimmedDisplayName = displayName.trim();
  return trimmedDisplayName && trimmedDisplayName.length <= 32;
};

export { validateDisplayName };
