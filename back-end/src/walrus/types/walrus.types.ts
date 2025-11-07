/**
 * Walrus Service Interface
 */
export interface IWalrusService {
  storageCost(size: number, epochs: number): Promise<{ storageCost: bigint }>;
  getSystemState(): Promise<{ epoch: bigint }>;
}
