"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/lib/config/sui";
import type { WalrusBlob, BlobState } from "@/types/storage";

export const useWalletBlobs = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const blobObjectType = useNetworkVariable("blobObjectType");
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
        const result = await suiClient.getOwnedObjects({
          owner: currentAccount.address,
          filter: {
            StructType: blobObjectType,
          },
          options: {
            showContent: true,
            showType: true,
          },
          cursor: reset ? undefined : state.cursor || undefined,
          limit: 20,
        });

        // Parse blob objects
        const parsedObjects: WalrusBlob[] = result.data
          .filter((obj) => obj.data?.content && "fields" in obj.data.content)
          .map((obj) => {
            const fields = (obj.data!.content as any).fields;
            const storageFields = fields.storage?.fields || {};

            return {
              objectId: obj.data!.objectId,
              blobId: fields.blob_id || "",
              size: BigInt(fields.size || 0),
              encodingType: Number(fields.encoding_type || 0),
              registeredEpoch: Number(fields.registered_epoch || 0),
              certifiedEpoch: fields.certified_epoch
                ? Number(fields.certified_epoch)
                : null,
              deletable: Boolean(fields.deletable),
              storage: {
                objectId: storageFields.id?.id || "",
                startEpoch: Number(storageFields.start_epoch || 0),
                endEpoch: Number(storageFields.end_epoch || 0),
                storageSize: BigInt(storageFields.storage_size || 0),
              },
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
    [currentAccount, suiClient, blobObjectType, state.cursor]
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
