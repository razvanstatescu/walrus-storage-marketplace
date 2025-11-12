"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/config/sui";
import type { WalrusStorage, StorageState } from "@/types/storage";

export const useWalletStorage = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const storageObjectType = useNetworkVariable("storageObjectType");
  const loadedRef = useRef(false);

  const [state, setState] = useState<StorageState>({
    objects: [],
    isLoading: false,
    error: null,
    hasMore: true,
    cursor: null,
  });

  const loadStorage = useCallback(
    async (reset = false) => {
      if (!currentAccount) {
        setState({
          objects: [],
          isLoading: false,
          error: null,
          hasMore: false,
          cursor: null,
        });
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: storageObjectType,
          },
          options: {
            showContent: true,
            showType: true,
          },
          cursor: reset ? undefined : state.cursor || undefined,
          limit: 20,
        });

        // Parse storage objects
        const parsedObjects: WalrusStorage[] = result.data
          .filter((obj) => obj.data?.content && "fields" in obj.data.content)
          .map((obj) => {
            const fields = (obj.data!.content as any).fields;
            return {
              objectId: obj.data!.objectId,
              storageSize: BigInt(fields.storage_size || fields.size || 0),
              startEpoch: Number(fields.start_epoch || 0),
              endEpoch: Number(fields.end_epoch || 0),
            };
          });

        setState((prev) => ({
          objects: reset
            ? parsedObjects
            : [...prev.objects, ...parsedObjects],
          isLoading: false,
          error: null,
          hasMore: result.hasNextPage,
          cursor: result.nextCursor,
        }));

        console.log("Storage objects loaded:", parsedObjects.length);
      } catch (error) {
        console.error("Failed to load storage objects:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    },
    [currentAccount, suiClient, storageObjectType, state.cursor]
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.cursor) {
      loadStorage(false);
    }
  }, [loadStorage, state.hasMore, state.isLoading, state.cursor]);

  const refresh = useCallback(() => {
    loadedRef.current = false;
    setState((prev) => ({ ...prev, cursor: null }));
    loadStorage(true);
  }, [loadStorage]);

  useEffect(() => {
    if (!loadedRef.current && currentAccount) {
      loadedRef.current = true;
      loadStorage(true);
    } else if (!currentAccount) {
      loadedRef.current = false;
      setState({
        objects: [],
        isLoading: false,
        error: null,
        hasMore: false,
        cursor: null,
      });
    }
  }, [currentAccount?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    loadMore,
    refresh,
  };
};
