"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useStorewaveSDK } from "./useStorewaveSDK";
import type { WalrusBlob, BlobState } from "@/types/storage";

export const useWalletBlobs = () => {
  const currentAccount = useCurrentAccount();
  const sdk = useStorewaveSDK();
  const loadedRef = useRef(false);

  const [state, setState] = useState<BlobState>({
    objects: [],
    isLoading: false,
    error: null,
    hasMore: true,
    cursor: null,
  });

  const loadBlobs = useCallback(
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
        const result = await sdk.getWalletBlobs({
          address: currentAccount.address,
          cursor: reset ? undefined : state.cursor || undefined,
          limit: 20,
        });

        // SDK returns already-parsed blob objects
        const parsedObjects: WalrusBlob[] = result.data;

        setState((prev) => ({
          objects: reset
            ? parsedObjects
            : [...prev.objects, ...parsedObjects],
          isLoading: false,
          error: null,
          hasMore: result.hasMore,
          cursor: result.nextCursor,
        }));

        console.log("Blob objects loaded:", parsedObjects.length);
      } catch (error) {
        console.error("Failed to load blob objects:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    },
    [currentAccount, sdk, state.cursor]
  );

  const loadMore = useCallback(() => {
    if (state.hasMore && !state.isLoading && state.cursor) {
      loadBlobs(false);
    }
  }, [loadBlobs, state.hasMore, state.isLoading, state.cursor]);

  const refresh = useCallback(() => {
    loadedRef.current = false;
    setState((prev) => ({ ...prev, cursor: null }));
    loadBlobs(true);
  }, [loadBlobs]);

  useEffect(() => {
    if (!loadedRef.current && currentAccount) {
      loadedRef.current = true;
      loadBlobs(true);
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
