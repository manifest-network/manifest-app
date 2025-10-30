import { cosmwasm } from '@manifest-network/manifestjs';
import { useQuery } from '@tanstack/react-query';

import env from '@/config/env';

const createLcdQueryClient = cosmwasm.ClientFactory.createLCDClient;

export const useCosmWasmLcdQueryClient = () => {
  const lcdQueryClient = useQuery({
    queryKey: ['lcdQueryClientCosmWasm', env.apiUrl],
    queryFn: () =>
      createLcdQueryClient({
        restEndpoint: env.apiUrl,
      }),
    enabled: !!env.apiUrl,
    staleTime: Infinity,
  });

  return {
    lcdQueryClient: lcdQueryClient.data,
  };
};
