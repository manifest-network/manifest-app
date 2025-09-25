import { Dialog } from '@headlessui/react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { ArrowRightOnRectangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState } from 'react';
import { MdContacts } from 'react-icons/md';

import { CopyIcon } from '@/components/icons';
import { Username } from '@/components/username';
import { useBalance } from '@/hooks/useQueries';
import { getRealLogo, shiftDigits, truncateAddress } from '@/utils';
import { ProfileAvatar } from '@/utils/identicon';

import { ContactsModal } from './Contacts';

export const Connected = ({
  onClose,
  logo,
  onReturn,
  disconnect,
  name,
  username,
  address,
}: {
  onClose: () => void;
  logo: string;
  onReturn: () => void;
  disconnect: () => void;
  name: string;
  username?: string;
  address?: string;
}) => {
  const { balance } = useBalance(address ?? '');
  const [copied, setCopied] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-2 w-full mx-auto pt-4">
      <div className="flex justify-between items-center -mt-4 mb-6">
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-gray-200 dark:hover:bg-[#00000033]"
          onClick={onReturn}
        >
          <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
        </button>
        <div className="flex flex-row gap-2 items-center">
          <Image
            height={0}
            width={0}
            src={name === 'Leap Cosmos MetaMask' ? '/metamask.svg' : getRealLogo(logo, isDarkMode)}
            alt={name}
            className="w-8 h-8 rounded-full mr-2"
          />
          <Dialog.Title as="h3" className="text-md font-semibold">
            {name}
          </Dialog.Title>
        </div>
        <button
          type="button"
          className="p-2 text-primary bg-neutral rounded-full hover:bg-gray-200 dark:hover:bg-[#00000033]"
          onClick={onClose}
        >
          <XMarkIcon className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center flex-row justify-between mb-6">
        <div className="flex items-center ">
          <ProfileAvatar walletAddress={address ?? ''} size={60} />
          <div className="ml-4">
            <Username className="text-lg font-semibold" walletName={name} username={username} />
            <div className="flex items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {truncateAddress(address || '')}
              </p>
              <button
                onClick={copyAddress}
                className="ml-2 p-1 rounded-full hover:bg-[#FFFFFFCC] dark:hover:bg-[#FFFFFF0F]  transition-colors duration-200"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-500" />
                ) : (
                  <CopyIcon className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowContacts(true)}
          className="ml-2 p-1 rounded-full hover:bg-[#FFFFFFCC] dark:hover:bg-[#FFFFFF0F] btn btn-ghost btn-md transition-colors md:block hidden duration-200"
        >
          <MdContacts className="w-8 h-8 text-primary" />
        </button>

        <ContactsModal
          className="z-[9999]"
          open={showContacts}
          onClose={() => setShowContacts(false)}
          selectionMode={false}
        />
      </div>
      <div className="bg-base-300 dark:bg-base-300 rounded-lg py-3 px-2 mb-4">
        <p className="text-sm leading-4 tracking-wider text-gray-500 dark:text-gray-400 mb-1 ml-2">
          Balance
        </p>
        <div className="flex items-center">
          {balance?.amount ? (
            <p className="text-md dark:text-[#FFFFFF99] text-black font-bold ml-2">
              {Number(shiftDigits(balance?.amount ?? '', -6)).toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
            </p>
          ) : (
            <div className="skeleton w-32 h-4"></div>
          )}
          <p className="text-md ml-2 dark:text-[#FFFFFF99] text-black">MFX</p>
        </div>
      </div>

      <button
        className="w-full btn btn-disconnect-gradient rounded-lg transition duration-200 flex items-center text-white justify-center"
        onClick={() => {
          disconnect();
          onClose();
        }}
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
        Disconnect
      </button>
    </div>
  );
};
