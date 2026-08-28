import React, { useState } from 'react';
import { getWalletService } from '../core/wallet';

export const SendTransaction: React.FC = () => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!to || !amount) return;
    setLoading(true);
    try {
      const service = getWalletService();
      const hash = await service.sendETH(to, amount);
      alert(`Sent! TX: ${hash}`);
      setTo('');
      setAmount('');
    } catch (err) {
      alert('Transaction failed!');
      console.error('Transaction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm text-gray-400">Recipient</label>
        <input
          type="text"
          placeholder="0x..."
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 rounded text-white placeholder-gray-500"
        />
      </div>
      <div>
        <label className="text-sm text-gray-400">Amount (ETH)</label>
        <input
          type="text"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 rounded text-white placeholder-gray-500"
        />
      </div>
      <button
        onClick={handleSend}
        disabled={loading || !to || !amount}
        className="px-4 py-2 bg-blue-600 rounded text-white disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send ETH'}
      </button>
    </div>
  );
};
