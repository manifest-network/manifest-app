import { MetadataSDKType } from '@manifest-network/manifestjs/dist/codegen/cosmos/bank/v1beta1/bank';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { sanitizeImageUrl } from '@/lib/image-loader';
import { ProfileAvatar } from '@/utils/identicon';

export const DenomImage = ({
  denom,
  withBackground = true,
}: {
  denom?: MetadataSDKType | null;
  withBackground?: boolean;
}) => {
  const [imageError, setImageError] = useState(false);
  const [sanitizedUri, setSanitizedUri] = useState<string>('');

  useEffect(() => {
    if (denom?.uri) {
      const sanitized = sanitizeImageUrl(denom.uri);
      setSanitizedUri(sanitized);
      setImageError(false);
    } else {
      setSanitizedUri('');
      setImageError(false);
    }
  }, [denom?.uri]);

  // Check for MFX token first
  if (denom?.base === 'umfx' || denom?.base?.includes('uosmo')) {
    return (
      <div className={`w-11 h-11 p-2 rounded-md ${withBackground ? 'bg-surface-inset' : ''}`}>
        <Image
          width={44}
          height={44}
          src={denom?.base === 'umfx' ? '/logo.svg' : '/osmosis.svg'}
          alt="MFX Token Icon"
          className="w-full h-full data-[loaded=false]:animate-pulse data-[loaded=false]:skeleton data-[loaded=false]:bg-base-300"
        />
      </div>
    );
  }

  // Use sanitized URI instead of checking supported domains/patterns
  if (sanitizedUri && !imageError) {
    return (
      <div className={`w-11 h-11 p-2 rounded-md ${withBackground ? 'bg-surface-inset' : ''}`}>
        <Image
          width={44}
          height={44}
          src={sanitizedUri}
          alt="Token Icon"
          onError={() => setImageError(true)}
          className="rounded-md w-full h-full data-[loaded=false]:animate-pulse data-[loaded=false]:skeleton data-[loaded=false]:bg-base-300"
        />
      </div>
    );
  }

  // Fallback to ProfileAvatar if no URI or image error
  return <ProfileAvatar walletAddress={denom?.base} withBackground={withBackground} />;
};
