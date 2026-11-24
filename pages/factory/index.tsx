import { useChain } from '@cosmos-kit/react';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';

import { FactoryIcon, IfWalletConnected, SearchIcon } from '@/components';
import { SEO } from '@/components';
import DenomList from '@/components/factory/components/DenomList';
import env from '@/config/env';
import {
  useTokenBalances,
  useTokenFactoryDenomsFromAdmin,
  useTokenFactoryDenomsMetadata,
  useTotalSupply,
} from '@/hooks';
import useIsMobile from '@/hooks/useIsMobile';
import { useResponsivePageSize } from '@/hooks/useResponsivePageSize';
import { ExtendedMetadataSDKType } from '@/utils';

interface PageSizeConfig {
  denomList: number;
  skeleton: number;
}

export default function Factory() {
  const { address } = useChain(env.chain);
  const isMobile = useIsMobile();
  const { denoms, isDenomsLoading, isDenomsError } = useTokenFactoryDenomsFromAdmin(address ?? '');
  const { metadatas, isMetadatasLoading, isMetadatasError } = useTokenFactoryDenomsMetadata();
  const { balances, isBalancesLoading, isBalancesError } = useTokenBalances(address ?? '');
  const { totalSupply, isTotalSupplyLoading, isTotalSupplyError } = useTotalSupply();

  const sizeLookup: Array<{ height: number; width: number; sizes: PageSizeConfig }> = [
    {
      height: 768,
      width: Infinity,
      sizes: { denomList: 3, skeleton: 3 },
    },
    {
      height: 800,
      width: Infinity,
      sizes: { denomList: 5, skeleton: 5 },
    },
    {
      height: 1000,
      width: 800,
      sizes: { denomList: 6, skeleton: 6 },
    },
    {
      height: 1000,
      width: Infinity,
      sizes: { denomList: 6, skeleton: 6 },
    },
    {
      height: 1200,
      width: Infinity,
      sizes: { denomList: 8, skeleton: 8 },
    },
  ];

  const defaultSizes = { denomList: 10, skeleton: 10 };
  const responsivePageSize = useResponsivePageSize(sizeLookup, defaultSizes);
  const pageSize = isMobile ? { denomList: 4, skeleton: 4 } : responsivePageSize;

  const denomListPageSize = pageSize.denomList;

  const isLoading =
    isDenomsLoading || isMetadatasLoading || isBalancesLoading || isTotalSupplyLoading;
  const isError = isDenomsError || isMetadatasError || isBalancesError || isTotalSupplyError;

  const combinedData = useMemo(() => {
    if (denoms?.denoms && metadatas?.metadatas && balances && totalSupply) {
      const otherTokens = denoms.denoms
        .filter(denom => denom !== 'umfx')
        .map((denom: string) => {
          const metadata = metadatas.metadatas.find(meta => meta.base === denom);
          const balance = balances.find(bal => bal.denom === denom);
          const supply = totalSupply.find(supply => supply.denom === denom);
          return metadata
            ? {
                ...metadata,
                balance: balance?.amount || '0',
                totalSupply: supply?.amount || '0',
              }
            : null;
        })
        .filter((meta): meta is ExtendedMetadataSDKType => meta !== null);

      // Sort tokens alphabetically by ticker name (symbol)
      const sortedTokens = otherTokens.sort((a, b) => {
        const tickerA = (a.symbol || a.display || a.name || '').toLowerCase();
        const tickerB = (b.symbol || b.display || b.name || '').toLowerCase();
        return tickerA.localeCompare(tickerB);
      });

      return [...sortedTokens];
    }
    return [];
  }, [denoms, metadatas, balances, totalSupply]);

  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="relative mx-auto">
      <SEO title="Factory - Alberto" />

      <div className="grow h-full animate-fadeIn transition-all duration-300 mt-8 lg:mt-0">
        <div className="w-full mx-auto relative z-100">
          <IfWalletConnected icon={FactoryIcon} message="start interacting with your tokens">
            {combinedData.length === 0 && !isLoading ? (
              <NoAssetsFound />
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    <h1
                      className="text-secondary-content"
                      style={{ fontSize: '20px', fontWeight: 700, lineHeight: '24px' }}
                    >
                      Tokens
                    </h1>
                    <div className="relative w-full sm:w-[224px]">
                      <input
                        type="text"
                        placeholder="Search for a token ..."
                        className="input input-bordered w-full h-[40px] border-none bg-secondary text-secondary-content pl-10 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                      <SearchIcon className="h-6 w-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-content-muted" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-full">
                  {isError ? (
                    <div className="text-center my-auto text-error">
                      Error loading tokens. Please try again.
                    </div>
                  ) : (
                    <DenomList
                      denoms={combinedData}
                      isLoading={isLoading}
                      pageSize={denomListPageSize}
                      address={address ?? ''}
                      admin={address ?? ''}
                      searchTerm={searchTerm}
                    />
                  )}
                </div>
              </div>
            )}
          </IfWalletConnected>
        </div>
      </div>
    </div>
  );
}

function NoAssetsFound() {
  return (
    <section className="transition-opacity duration-300 h-[80vh] ease-in-out animate-fadeIn w-full flex items-center justify-center">
      <div className="grid max-w-4xl bg-base-300 p-12 rounded-md w-full mx-auto gap-8 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-2xl mb-4 text-2xl font-extrabold tracking-tight leading-none md:text-3xl xl:text-4xl text-base-content">
            No Assets Found
          </h1>
          <p className="max-w-2xl mb-6 font-light text-content-muted lg:mb-8 md:text-lg lg:text-xl">
            You do not have any factory assets yet. Create a new asset in the factory page!
          </p>
          <Link href="/factory/create" className="btn btn-gradient" passHref>
            Create New Token
          </Link>
        </div>
        <div className="hidden lg:mt-0 lg:ml-24 lg:col-span-5 lg:flex">
          <FactoryIcon className="h-60 w-60 text-primary" />
        </div>
      </div>
    </section>
  );
}
