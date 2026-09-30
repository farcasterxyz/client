const getMimeType = (path: string) => {
  const dotIndex = path.lastIndexOf('.');

  if (dotIndex === -1) {
    return;
  }

  const extension = path.substr(dotIndex + 1).trim();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
  }
};

export { getMimeType };
