import React, { useState, useEffect } from 'react';
import { getWalletService } from '../core/wallet';
import { TokenInfo } from '../core/wallet-service';

export const TokenManager: React.FC = () => {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  // Preloaded popular tokens (Ethereum mainnet)
  const DEFAULT_TOKENS=***
    '0xdAC17F958D2ee523a22062e66101294F6390626a', // USDT
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3666eB48', // USDC
    '0xC02aaA39b223FE8D0A0e5B07D2F2d351324d3CE6', // WETH
  ];

  const loadTokens = async () => {
    setLoading(true);
    try {
      const service = getWalletService();
      const tokenData = await service.getTokens(DEFAULT_TOKENS);
      setTokens(tokenData);
      if (tokenData.length > 0) setSelectedToken(tokenData[0]);
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToken = async () => {
    if (!selectedToken || !to || !amount) return;
    try {
      const service = getWalletService();
      const hash = await service.sendToken(selectedToken.address, to, amount);
      alert(`Token sent! TX: ${hash}`);
      setTo('');
      setAmount('');
    } catch (err) {
      alert('Token send failed!');
      console.error('Token send failed:', err);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-sm text-gray-400">Loading tokens...</div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token) => (
            <div
              key={token.address}
              onClick={() => setSelectedToken(token)}
              className={`p-2 rounded cursor-pointer ${
                selectedToken?.address === token.address
                  ? 'bg-blue-900/30 border border-blue-500'
                  : 'bg-gray-800/30 border border-gray-700'
              }`}
            >
              <div className="flex justify-between">
                <span>{token.symbol}</span>
                <span>{token.balance}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedToken && (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-400">To address</label>
            <input
              type="text"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded text-white placeholder-gray-500 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">
              Amount ({selectedToken.symbol})
            </label>
            <input
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded text-white placeholder-gray-500 text-sm"
            />
          </div>
          <button
            onClick={handleSendToken}
            disabled={!to || !amount}
            className="w-full px-2 py-1 bg-blue-600 rounded text-sm text-white"
          >
            Send {selectedToken.symbol}
          </button>
        </div>
      )}
    </div>
  );
};
