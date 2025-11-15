/**
 * React component example for viewing and listing wallet storage
 */

import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { WalStorageMarketplace, type WalrusStorage } from 'storewave-sdk';

export function WalletStorage() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [storage, setStorage] = useState<WalrusStorage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [price, setPrice] = useState('1.0');

  // Initialize SDK
  const sdk = new WalStorageMarketplace('testnet', {
    backendApiUrl: 'http://localhost:3000',
  });

  useEffect(() => {
    if (currentAccount) {
      loadStorage();
    }
  }, [currentAccount]);

  const loadStorage = async () => {
    if (!currentAccount) return;

    try {
      setIsLoading(true);
      const result = await sdk.getWalletStorage({
        address: currentAccount.address,
        limit: 20,
      });
      setStorage(result.data);
    } catch (error) {
      console.error('Failed to load storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListStorage = async () => {
    if (!currentAccount || selectedIds.length === 0) return;

    try {
      setIsLoading(true);

      const tx = new Transaction();

      // List selected storage objects with the same price
      const prices = selectedIds.map(() => parseFloat(price));

      await sdk.listStorage({
        tx,
        storageObjectIds: selectedIds,
        pricesInWal: prices,
        senderAddress: currentAccount.address,
      });

      // Sign and execute
      const result = await signAndExecuteTransaction({ transaction: tx });

      console.log('Listed successfully:', result.digest);
      alert(`Storage listed! TX: ${result.digest}`);

      // Reload storage
      await loadStorage();
      setSelectedIds([]);
    } catch (error) {
      console.error('Failed to list storage:', error);
      alert('Failed to list storage: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="wallet-storage">
      <h2>My Storage Objects</h2>

      {isLoading && <p>Loading...</p>}

      {!isLoading && storage.length === 0 && <p>No storage objects found</p>}

      {!isLoading && storage.length > 0 && (
        <>
          <div className="storage-list">
            {storage.map((item) => (
              <div key={item.objectId} className="storage-item">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.objectId)}
                  onChange={() => toggleSelection(item.objectId)}
                />
                <div>
                  <p>
                    <strong>Object ID:</strong> {item.objectId.slice(0, 10)}...
                  </p>
                  <p>
                    <strong>Size:</strong> {(Number(item.storageSize) / (1024 * 1024)).toFixed(2)} MiB
                  </p>
                  <p>
                    <strong>Epochs:</strong> {item.startEpoch} - {item.endEpoch}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="list-form">
              <h3>List {selectedIds.length} storage object(s)</h3>
              <div className="field">
                <label>Price per object (WAL)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0.0001"
                  step="0.1"
                />
              </div>
              <button onClick={handleListStorage} disabled={isLoading}>
                {isLoading ? 'Listing...' : 'List on Marketplace'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
