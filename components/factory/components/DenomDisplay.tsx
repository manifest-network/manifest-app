import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import React from 'react';

import { DenomImage, VerifiedIcon } from '@/components';
import env from '@/config/env';
import { formatTokenDisplay } from '@/utils';

export const DenomVerifiedBadge = ({
  base,
  ...props
}: { base?: string } & { [i: string]: unknown }) => {
  const verified = base === 'umfx' || base === env.pwrTokenDenom;

  return verified ? <VerifiedIcon {...props} /> : <></>;
};

export interface DenomDisplayProps {
  denom?: string;
  metadata?: MetadataSDKType | null;
  withBackground?: boolean;
  image?: boolean;
}

export const DenomDisplay = ({
  denom,
  metadata,
  withBackground,
  image = true,
}: DenomDisplayProps) => {
  const name = formatTokenDisplay(denom ?? metadata?.display ?? '?').toUpperCase();

  return (
    <>
      {image && (
        <div className="flex items-center justify-center">
          <DenomImage withBackground={withBackground} denom={metadata} />
        </div>
      )}
      <span>
        {name}
        {metadata?.base && (
          <DenomVerifiedBadge
            base={metadata?.base}
            className="w-4 mx-1 inline relative bottom-1 text-primary"
          />
        )}
      </span>
    </>
  );
};
