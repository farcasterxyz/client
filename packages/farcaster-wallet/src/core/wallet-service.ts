import { Wallet, JsonRpcProvider, Contract, ethers } from 'ethers';

// Standard ERC-20 ABI (subset)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  "function decimals() view returns (uint8)",
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint amount) returns (boolean)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (boolean)',
];

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  balance: string;
}

export class WalletService {
  private wallet: Wallet | null = null;
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string = 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY') {
    this.provider = new JsonRpcProvider(rpcUrl);
  }

  /** Create a new random wallet */
  createWallet(): string {
    this.wallet = Wallet.createRandom().connect(this.provider);
    return this.wallet.address;
  }

  /** Import existing wallet via private key */
  importWallet(privateKey: string): string {
    this.wallet = new Wallet(privateKey).connect(this.provider);
    return this.wallet.address;
  }

  /** Get current wallet address */
  getAddress(): string | null {
    return this.wallet?.address ?? null;
  }

  /** Get ETH balance */
  async getBalance(): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const balance = await this.wallet.getBalance();
    return balance.toString();
  }

  /** Send ETH */
  async sendETH(to: string, amount: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const tx = await this.wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });
    return tx.hash;
  }

  /** Get token info (symbol, name, decimals, balance) */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const contract = new Contract(tokenAddress, ERC20_ABI, this.wallet);

    const [symbol, name, decimals, balance] = await Promise.all([
      contract.symbol(),
      contract.name(),
      contract.decimals(),
      contract.balanceOf(this.wallet.address),
    ]);

    return {
      symbol,
      name,
      decimals,
      address: tokenAddress,
      balance: balance.toString(),
    };
  }

  /** Send ERC-20 tokens */
  async sendToken(tokenAddress: string, to: string, amount: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    const contract = new Contract(tokenAddress, ERC20_ABI, this.wallet);
    const tokenInfo = await this.getTokenInfo(tokenAddress);
    const parsedAmount = ethers.parseUnits(amount, tokenInfo.decimals);

    const tx = await contract.transfer(to, parsedAmount);
    return tx.hash;
  }

  /** Get balances for multiple tokens */
  async getTokens(tokenAddresses: string[]): Promise<TokenInfo[]> {
    const promises = tokenAddresses.map((addr) =>
      this.getTokenInfo(addr).catch(() => ({
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        address: addr,
        balance: '0',
      }))
    );
    return Promise.all(promises);
  }

  /** Sign a message */
  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet not initialized');
    return this.wallet.signMessage(message);
  }
}
