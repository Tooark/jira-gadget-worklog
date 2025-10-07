import { invoke } from '@forge/bridge';
import { useEffect, useState } from 'react';

import { log } from '../helpers';

export function useForgeInvoke<T>(
  functionKey: string,
  invokePayload?: Record<string, unknown>,
) {
  const [data, setData] = useState<T | undefined>();

  // Serialize o payload para que literais de objeto (que são recriados em
  // cada renderização) não acionem o efeito desnecessariamente. Mantemos a
  // string serializada nas dependências em vez do objeto bruto.
  const serializedPayload = invokePayload ? JSON.stringify(invokePayload) : undefined;

  useEffect(() => {
    let mounted = true;

    // Evita redefinir o estado se desmontado (segurança para montagens duplas / StrictMode)
    invoke<T>(functionKey, invokePayload)
      .then((res) => {
        if (mounted) {
          setData(res);
        }
      })
      .catch(log.error);

    return () => {
      mounted = false;
    };
    // Somente executa novamente quando a tecla de função ou a carga serializada for alterada.
  }, [functionKey, serializedPayload]);

  return data;
}
