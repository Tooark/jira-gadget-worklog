import { invoke } from '@forge/bridge';
import { useEffect, useState } from 'react';

import { log } from '../helpers';

export function useForgeInvoke<T>(
  functionKey: string,
  invokePayload?: Record<string, unknown>,
) {
  const [data, setData] = useState<T | undefined>();

  // Serialize the payload so that object literals (which get recreated on
  // every render) don't trigger the effect unnecessarily. We keep the
  // serialized string in the dependencies instead of the raw object.
  const serializedPayload = invokePayload ? JSON.stringify(invokePayload) : undefined;

  useEffect(() => {
    let mounted = true;

    // Avoid re-setting state if unmounted (safety for double mounts / StrictMode)
    invoke<T>(functionKey, invokePayload)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch(log.error);

    return () => {
      mounted = false;
    };
    // Only re-run when the function key or the serialized payload changes.
  }, [functionKey, serializedPayload]);

  return data;
}
