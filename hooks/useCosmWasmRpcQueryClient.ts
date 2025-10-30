import { cosmwasm } from '@manifest-network/manifestjs';
import { useQuery } from '@tanstack/react-query';

import env from '@/config/env';

const createRpcQueryClient = cosmwasm.ClientFactory.createRPCQueryClient;

export const useCosmWasmRpcQueryClient = () => {
  const rpcQueryClient = useQuery({
    queryKey: ['rpcQueryClient', env.rpcUrl],
    queryFn: () =>
      createRpcQueryClient({
        rpcEndpoint: env.rpcUrl,
      }),
    enabled: !!env.rpcUrl,
    staleTime: Infinity,
  });

  return {
    rpcQueryClient: rpcQueryClient.data,
  };
};
