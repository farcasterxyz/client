export const BASE_CHAIN_ID = 8453;
export const ZORA_CHAIN_ID = 7777777;
export const OP_CHAIN_ID = 10;
export const ETH_CHAIN_ID = 1;

export const ETH_CHAIN_URI_PREFIX = `chain://eip155:${ETH_CHAIN_ID}/`;
export const BASE_CHAIN_URI_PREFIX = `chain://eip155:${BASE_CHAIN_ID}/`;
export const ZORA_CHAIN_URI_PREFIX = `chain://eip155:${ZORA_CHAIN_ID}/`;
export const OP_CHAIN_URI_PREFIX = `chain://eip155:${OP_CHAIN_ID}/`;

export const CAIP_19_PATTERN =
  /([a-z0-9]+):((?:0x)?[a-fA-F0-9]{1,})(\/(\d+))?$/;
