const videoRequestHeaders = {
  headers: {
    // https:// prefix is needed for Cloudflare streaming calls
    Referer: `https://farcaster.xyz`,
  },
};

export { videoRequestHeaders };
