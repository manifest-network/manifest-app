/* eslint-disable @next/next/no-img-element */
import CryptoJS from 'crypto-js';
import Identicon, { IdenticonOptions } from 'identicon.js';
import React, { useEffect, useState } from 'react';

const COLORS: [number, number, number, number][] = [
  [56, 12, 197, 255],
  [160, 135, 255, 255],
  [88, 218, 210, 255],
  [225, 225, 249, 255],
];

export function identiconFromWalletAddress(walletAddress: string, size?: number) {
  const hash = CryptoJS.SHA256(walletAddress).toString(CryptoJS.enc.Hex);
  const colorIndex = parseInt(hash.charAt(hash.length - 1), 16) % COLORS.length;

  const options: IdenticonOptions = {
    foreground: COLORS[colorIndex],
    background: [255, 255, 255, 0],
    margin: 0.21,
    size: size ?? 700,
    format: 'svg',
  };

  return new Identicon(hash, options);
}

export const ProfileAvatar = ({
  walletAddress,
  size,
  withBackground = true,
}: {
  walletAddress?: string;
  size?: number;
  withBackground?: boolean;
}) => {
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>();

  useEffect(() => {
    if (walletAddress) {
      const identicon = identiconFromWalletAddress(walletAddress, size);
      setAvatarSrc(`data:image/svg+xml;base64,${identicon.toString()}`);
    }
  }, [walletAddress, size]);

  const imageSize = size ? `${size}px` : '44px';

  return (
    <img
      src={avatarSrc}
      alt="Profile Avatar"
      className={`rounded-md ${withBackground ? 'bg-surface-inset' : ''}`}
      style={{ height: imageSize, width: imageSize }}
    />
  );
};
