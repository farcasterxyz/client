import { WalletService } from './wallet-service';

let walletService: WalletService | null = null;

/** Get singleton WalletService instance */
export function getWalletService(): WalletService {
  if (!walletService) {
    walletService = new WalletService();
  }
  return walletService;
}

/** Reset the wallet singleton */
export function resetWallet(): void {
  walletService = null;
}

export { WalletService } from './wallet-service';
export type { TokenInfo } from './wallet-service';
