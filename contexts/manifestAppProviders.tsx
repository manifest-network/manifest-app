import { Chain } from '@chain-registry/types';
import { Registry } from '@cosmjs/proto-signing';
import { AminoTypes, SigningStargateClientOptions } from '@cosmjs/stargate';
import { MainWalletBase } from '@cosmos-kit/core';
import { ChainProvider } from '@cosmos-kit/react';
import {
  cosmosAminoConverters,
  cosmosProtoRegistry,
  cosmwasmAminoConverters,
  cosmwasmProtoRegistry,
  ibcAminoConverters,
  ibcProtoRegistry,
  liftedinitAminoConverters,
  liftedinitProtoRegistry,
  osmosisAminoConverters,
  osmosisProtoRegistry,
  strangeloveVenturesAminoConverters,
  strangeloveVenturesProtoRegistry,
} from '@manifest-network/manifestjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SignerOptions } from 'cosmos-kit';
import { ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { TailwindModal } from '@/components';
import env from '@/config/env';
import { manifestAssets, manifestChain } from '@/config/manifestChain';
import { osmosisAssets, osmosisChain } from '@/config/osmosisChain';
import { ThemeProvider } from '@/contexts';
import { ToastProvider } from '@/contexts/toastContext';
import { Web3AuthContext, Web3AuthProvider } from '@/contexts/web3AuthContext';
import { ContactsProvider } from '@/hooks';

const ManifestChainProvider = ({ children }: { children: ReactNode }) => {
  const web3auth = useContext(Web3AuthContext);
  const combinedWallets = web3auth.wallets as MainWalletBase[];
  const [chainProviderKey, setChainProviderKey] = useState(0);

  const endpointOptions = {
    isLazy: true,
    endpoints: {
      [env.chain]: {
        rpc: [env.rpcUrl],
        rest: [env.apiUrl],
      },
      ['osmosistestnet']: {
        rpc: [env.osmosisRpcUrl],
        rest: [env.osmosisApiUrl],
      },
    },
  };

  // signer options to support amino signing for all the different modules we use
  const signerOptions: SignerOptions = {
    signingStargate: (_chain: string | Chain): SigningStargateClientOptions | undefined => {
      const mergedRegistry = new Registry([
        ...cosmosProtoRegistry,
        ...osmosisProtoRegistry,
        ...strangeloveVenturesProtoRegistry,
        ...liftedinitProtoRegistry,
        ...ibcProtoRegistry,
        ...cosmwasmProtoRegistry,
      ]);
      const mergedAminoTypes = new AminoTypes({
        ...cosmosAminoConverters,
        ...liftedinitAminoConverters,
        ...osmosisAminoConverters,
        ...ibcAminoConverters,
        ...strangeloveVenturesAminoConverters,
        ...cosmwasmAminoConverters,
      });
      return {
        aminoTypes: mergedAminoTypes,
        registry: mergedRegistry,
      };
    },
  };

  // Function to force complete ChainProvider reset
  const forceChainProviderReset = useCallback(() => {
    setChainProviderKey(prev => prev + 1);
  }, []);

  // Expose the reset function to Web3AuthContext
  const contextValue = useMemo(
    () => ({
      ...web3auth,
      forceChainProviderReset,
    }),
    [web3auth, forceChainProviderReset]
  );

  return (
    <Web3AuthContext.Provider value={contextValue}>
      <ChainProvider
        key={chainProviderKey} // This forces complete re-mount and reset of cosmos-kit
        chains={[manifestChain, osmosisChain]}
        assetLists={[manifestAssets, osmosisAssets]}
        wallets={combinedWallets}
        logLevel={env.production ? 'NONE' : 'INFO'}
        endpointOptions={endpointOptions}
        sessionOptions={{ duration: 60 * 60 * 24 * 7 * 1000 }} // 7 days in ms
        walletConnectOptions={{
          signClient: {
            projectId: env.walletConnectKey,
            relayUrl: 'wss://relay.walletconnect.org',
            metadata: {
              name: 'Alberto',
              description: 'Manifest Network Web App',
              url: 'https://alberto.com',
              icons: [],
            },
          },
        }}
        signerOptions={signerOptions}
        // @ts-ignore
        walletModal={TailwindModal}
      >
        {children}
      </ChainProvider>
    </Web3AuthContext.Provider>
  );
};

export const ManifestAppProviders = ({ children }: { children: ReactNode }) => {
  const client = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={client}>
      <ReactQueryDevtools />
      <ContactsProvider>
        <Web3AuthProvider>
          <ManifestChainProvider>
            <ThemeProvider>
              <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
          </ManifestChainProvider>
        </Web3AuthProvider>
      </ContactsProvider>
    </QueryClientProvider>
  );
};
