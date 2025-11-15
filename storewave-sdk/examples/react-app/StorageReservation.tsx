/**
 * React component example for storage reservation
 */

import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { WalStorageMarketplace } from 'storewave-sdk';

export function StorageReservation() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [size, setSize] = useState(5);
  const [unit, setUnit] = useState<'GiB'>('GiB');
  const [duration, setDuration] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [cost, setCost] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  const sdk = new WalStorageMarketplace('testnet', {
    backendApiUrl: 'http://localhost:3000',
  });

  const handleGetCost = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const costResult = await sdk.getReservationCost({
        size,
        sizeUnit: unit,
        durationInEpochs: duration,
      });

      setCost(costResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get cost');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!currentAccount) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create transaction
      const tx = new Transaction();

      // Reserve storage (SDK auto-fetches WAL coins)
      const result = await sdk.reserveStorage({
        tx,
        size,
        sizeUnit: unit,
        durationInEpochs: duration,
        senderAddress: currentAccount.address,
      });

      if (result.dryRunResult?.usedSystemFallback) {
        console.warn('Marketplace unavailable, using system-only route');
      }

      if (!result.dryRunResult?.success) {
        throw new Error(result.dryRunResult?.error || 'Dry run failed');
      }

      // Sign and execute
      const txResult = await signAndExecuteTransaction({
        transaction: result.transaction,
      });

      console.log('Transaction successful:', txResult.digest);
      alert(`Storage reserved successfully! TX: ${txResult.digest}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reserve storage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="storage-reservation">
      <h2>Reserve Storage</h2>

      <div className="form">
        <div className="field">
          <label>Size</label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            min="1"
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'GiB')}>
            <option value="MiB">MiB</option>
            <option value="GiB">GiB</option>
            <option value="TiB">TiB</option>
          </select>
        </div>

        <div className="field">
          <label>Duration (epochs)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1"
          />
        </div>

        <button onClick={handleGetCost} disabled={isLoading || !currentAccount}>
          {isLoading ? 'Loading...' : 'Get Cost Preview'}
        </button>

        {cost && (
          <div className="cost-preview">
            <h3>Cost Preview</h3>
            <p>Current Epoch: {cost.currentEpoch}</p>
            <p>End Epoch: {cost.endEpoch}</p>
            <p>
              <strong>Optimized Route:</strong> {cost.optimizedRoute.totalCostInWal.toFixed(4)} WAL
            </p>
            <p>
              <strong>System-Only Route:</strong> {cost.systemOnlyRoute.totalCostInWal.toFixed(4)} WAL
            </p>
            {cost.savingsInWal > 0 && (
              <p className="savings">
                You save: {cost.savingsInWal.toFixed(4)} WAL ({cost.savingsPercentage.toFixed(2)}%)
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleReserve}
          disabled={isLoading || !currentAccount || !cost}
          className="primary"
        >
          {isLoading ? 'Reserving...' : 'Reserve Storage'}
        </button>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
