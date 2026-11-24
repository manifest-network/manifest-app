'use client';

import { Asset } from '@chain-registry/types';
import { OfflineAminoSigner } from '@cosmjs/amino';
import { StdSignDoc } from '@cosmjs/amino';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { useChain } from '@cosmos-kit/react';
import { SignDoc } from '@manifest-network/manifestjs/dist/codegen/cosmos/tx/v1beta1/tx';
import { Widget } from '@skip-go/widget';
import { useQueryClient } from '@tanstack/react-query';
import { useContext, useEffect, useRef } from 'react';
import { ShadowScopeConfigProvider } from 'react-shadow-scope';

import env from '@/config/env';
import { osmosisAssets } from '@/config/osmosisChain';
import { useTheme } from '@/contexts';
import { Web3AuthContext } from '@/contexts/web3AuthContext';
import { getIbcDenom } from '@/utils/ibc';

function IbcSendForm({ token }: { token: string }) {
  const { colors } = useTheme();
  const { address, getSigningStargateClient } = useChain(env.chain);
  const ibcDenom = getIbcDenom(env.chainId, token);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { setIsSigning } = useContext(Web3AuthContext);

  async function getCosmosSigner(): Promise<OfflineAminoSigner | OfflineDirectSigner> {
    const client = await getSigningStargateClient();
    if (!('signer' in client)) {
      throw new Error('No cosmos stargate client.');
    }
    const signer: OfflineAminoSigner | OfflineDirectSigner = (client as any).signer;

    // Find out which type of signer we have from the Stargate client,
    // then declare the right sign function which also set isSigning.
    if ('signAmino' in signer) {
      return {
        getAccounts: signer.getAccounts.bind(signer),
        signAmino: async (address: string, doc: StdSignDoc) => {
          setIsSigning(true);

          try {
            return await signer.signAmino(address, doc);
          } finally {
            setIsSigning(false);
          }
        },
      };
    } else if ('signDirect' in signer) {
      return {
        getAccounts: signer.getAccounts.bind(signer),
        signDirect: async (address: string, doc: SignDoc) => {
          setIsSigning(true);

          try {
            return await signer.signDirect(address, doc);
          } finally {
            setIsSigning(false);
          }
        },
      };
    } else {
      throw new Error('Invalid signer from stargate client.');
    }
  }

  // Add effect to handle overlay click events
  useEffect(() => {
    // Function to handle clicks on the document
    const handleDocumentClick = (event: MouseEvent) => {
      // Check if the click target is a div with the class that matches the modal backdrop
      const target = event.target as HTMLElement;

      // Get the path of elements from the click target up to the document
      const path = event.composedPath ? event.composedPath() : [];

      // Check if the click is on a backdrop-like element
      const isBackdropClick =
        // Direct class check on the target
        (target.tagName === 'DIV' &&
          (target.className.includes('sc-iuUfFv') || target.className.includes('sc-dprtRQ'))) ||
        // Check parent elements in the path for backdrop classes
        path.some(
          el =>
            el instanceof HTMLElement &&
            el.tagName === 'DIV' &&
            (el.className.includes('sc-iuUfFv') || el.className.includes('sc-dprtRQ'))
        );

      if (isBackdropClick) {
        // Find all open dialogs in shadow DOM using the same selector strategy as in sendModal.tsx
        const allInputs = [...document.querySelectorAll('react-shadow-scope')].map(s =>
          s.shadowRoot?.querySelector('div[open]')
        );

        const isSkipGoDialogOpened = allInputs.filter(Boolean).length > 0;

        if (isSkipGoDialogOpened) {
          // Get all the buttons and other interactive elements inside the modal
          const modalContent = document.querySelector('wcm-modal');

          // Check if the click was directly on the backdrop and not on any content
          const isClickOnContent =
            (modalContent && modalContent.contains(event.target as Node)) ||
            path.some(
              el =>
                el instanceof HTMLElement &&
                (el.classList.contains('rc-virtual-list-holder-inner') ||
                  el.tagName === 'BUTTON' ||
                  el.tagName === 'INPUT')
            );

          if (!isClickOnContent) {
            // Create and dispatch an escape key event to close the modal
            const escEvent = new KeyboardEvent('keydown', {
              key: 'Escape',
              code: 'Escape',
              keyCode: 27,
              which: 27,
              bubbles: true,
              cancelable: true,
            });
            document.dispatchEvent(escEvent);
          }
        }
      }
    };

    // Add the click event listener to the document
    document.addEventListener('click', handleDocumentClick, true);

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, []);

  // The widget takes its colors as strings, so they are read from the theme rather than repeated
  // here. Until they are available the widget uses its own default theme.
  const widgetTheme = colors && {
    brandColor: colors.primary,
    primary: {
      background: {
        normal: colors.secondary,
      },
      text: {
        normal: colors['base-content'],
        lowContrast: colors['content-muted'],
        ultraLowContrast: colors['content-subtle'],
      },
      ghostButtonHover: colors.primary,
    },
    secondary: {
      background: {
        normal: colors.primary,
        transparent: 'transparent',
        hover: colors.primary,
      },
    },
    success: {
      text: colors.success,
      background: colors['base-100'],
    },
    warning: {
      background: colors.warning,
      text: colors['warning-content'],
    },
    error: {
      background: colors.error,
      text: colors['error-content'],
    },
  };

  // filter osmosis tokens that are on manifest chain
  const manifestAssetsOnOsmosis = osmosisAssets.assets
    .filter((asset: Asset) =>
      asset?.traces?.some(
        trace => trace.type === 'ibc' && trace.counterparty.chain_name === env.chain
      )
    )
    .map((asset: Asset) => asset.base);

  return (
    <div
      aria-label="ibc-send-form"
      ref={containerRef}
      className="w-[100%] max-w-[500px] px-2 box-border relative"
    >
      <ShadowScopeConfigProvider config={{ dsd: 'off' }}>
        <Widget
          filter={{
            source: {
              [env.chainId]: undefined,
              [env.osmosisChainId]: [...manifestAssetsOnOsmosis, 'uosmo'],
            },
            destination: {
              [env.chainId]: undefined,
              [env.osmosisChainId]: [...manifestAssetsOnOsmosis, 'uosmo'],
            },
          }}
          defaultRoute={{
            srcAssetDenom: token,
            srcChainId: env.chainId,
            destChainId: env.osmosisChainId,
            destAssetDenom: ibcDenom,
            amountIn: 1,
            amountOut: 1,
          }}
          routeConfig={{
            allowUnsafe: true,
            allowSwaps: true,
          }}
          brandColor={colors?.primary}
          onlyTestnet={env.chainTier !== 'mainnet'}
          // The widget's default API (go.skip.build) only allows the mainnet wallet's origin, so
          // on QA and testnet it gets no data and asks to connect a wallet. Skip's public API
          // allows any origin. Mainnet keeps the default.
          apiUrl={env.chainTier !== 'mainnet' ? 'https://api.skip.build' : undefined}
          getCosmosSigner={getCosmosSigner}
          connectedAddresses={{
            [env.chainId]: address,
          }}
          onTransactionComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['balances'] });
            queryClient.invalidateQueries({ queryKey: ['balances-resolved'] });
            queryClient.invalidateQueries({ queryKey: ['getMessagesForAddress'] });
          }}
          theme={widgetTheme}
        />
      </ShadowScopeConfigProvider>
    </div>
  );
}

export default IbcSendForm;
