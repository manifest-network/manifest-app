import { MainWalletBase } from '@cosmos-kit/core';
import {
  SignData,
  Web3AuthClient,
  Web3AuthWallet,
  makeWeb3AuthWallets,
} from '@cosmos-kit/web3auth';
import { WEB3AUTH_NETWORK_TYPE } from '@web3auth/auth';
import { wallets as cosmosWallets } from 'cosmos-kit';
import { ReactNode, createContext, useCallback, useMemo, useState } from 'react';

import env from '@/config/env';

export interface Web3AuthContextType {
  prompt?: {
    signData: SignData;
    resolve: (approved: boolean) => void;
  };
  promptId?: string;
  setPromptId: React.Dispatch<React.SetStateAction<string | undefined>>;
  wallets: (MainWalletBase | Web3AuthWallet)[];
  isSigning: boolean;
  setIsSigning: (isSigning: boolean) => void;
  resetWeb3AuthClients: () => void;
  forceChainProviderReset?: () => void;
}

export const Web3AuthContext = createContext<Web3AuthContextType>({
  prompt: undefined,
  promptId: undefined,
  setPromptId: () => {},
  wallets: [],
  isSigning: false,
  setIsSigning: () => {},
  resetWeb3AuthClients: () => {},
  forceChainProviderReset: undefined,
});

export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  // web3auth helpers for cosmoskit
  const [prompt, setPrompt] = useState<
    | {
        signData: SignData;
        resolve: (approved: boolean) => void;
      }
    | undefined
  >();
  const [promptId, setPromptId] = useState<string>();

  // A shared signing state for all nodes.
  const [isSigning, setIsSigningInternal] = useState(false);
  const [_, setSigningCount] = useState(0);

  function setIsSigning(isSigning: boolean) {
    if (isSigning) {
      setSigningCount(prev => prev + 1);
      setIsSigningInternal(true);
    } else {
      setSigningCount(prev => {
        const newCount = prev - 1;
        if (newCount < 0) {
          console.error('signingCount is negative, this should not happen');
          return 0;
        }
        if (newCount === 0) {
          setIsSigningInternal(false);
        }
        return newCount;
      });
    }
  }

  const web3AuthWallets = useMemo(
    () =>
      makeWeb3AuthWallets({
        loginMethods: [
          {
            provider: 'google',
            name: 'Google',
            logo: '/google',
          },
          {
            provider: 'twitter',
            name: 'Twitter',
            logo: '/x',
          },
          {
            provider: 'github',
            name: 'GitHub',
            logo: '/github',
          },
          {
            provider: 'apple',
            name: 'Apple',
            logo: '/apple',
          },
          {
            provider: 'discord',
            name: 'Discord',
            logo: '/discord',
          },
          {
            provider: 'reddit',
            name: 'Reddit',
            logo: '/reddit',
          },
          {
            provider: 'email_passwordless',
            name: 'Email',
            logo: '/email',
          },
          {
            provider: 'sms_passwordless',
            name: 'SMS',
            logo: '/sms',
          },
        ],
        mfaLevel: 'optional',
        client: {
          clientId: env.web3AuthClientId,
          web3AuthNetwork: env.web3AuthNetwork as WEB3AUTH_NETWORK_TYPE, // Safe to cast since we validate the env vars in config/env.ts
          sessionTime: 60 * 60 * 24 * 7, // 7 days in s
        },
        promptSign: async (_, signData) =>
          new Promise(resolve =>
            setPrompt({
              signData,
              resolve: approved => {
                setPrompt(undefined);
                resolve(approved);
              },
            })
          ),
      }),
    []
  );

  /**
   * Reset Web3Auth clients and force cosmos-kit to refresh its client cache.
   * This is essential when switching between social accounts to prevent stale client state.
   */
  const resetWeb3AuthClients = useCallback(async () => {
    try {
      // Clear Web3Auth login hints for all social wallets
      web3AuthWallets.forEach(wallet => {
        if (wallet instanceof Web3AuthWallet && wallet.client instanceof Web3AuthClient) {
          // Clear any stored login hints using the available method
          wallet.client.setLoginHint('');
        }
      });

      // Force disconnect all Web3Auth wallets to clear their cached state
      const disconnectPromises = web3AuthWallets.map(async wallet => {
        if (wallet instanceof Web3AuthWallet) {
          try {
            if (wallet.walletStatus === 'Connected') {
              await wallet.disconnect();
            }
          } catch (error) {
            console.warn(`Failed to disconnect wallet ${wallet.walletInfo.name}:`, error);
          }
        }
      });

      await Promise.all(disconnectPromises);
    } catch (error) {
      console.error('❌ Error resetting Web3Auth clients:', error);
    }
  }, [web3AuthWallets]);

  // Combine the Web3auth wallets with the other wallets
  const wallets = [
    ...web3AuthWallets,
    ...cosmosWallets.for('keplr', 'cosmostation', 'leap', 'ledger'),
  ];

  return (
    <Web3AuthContext.Provider
      value={{
        prompt,
        promptId,
        setPromptId,
        wallets,
        isSigning,
        setIsSigning,
        resetWeb3AuthClients,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
};
