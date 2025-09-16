import { useChain } from '@cosmos-kit/react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { MdContacts, MdHome } from 'react-icons/md';
import { RiMenuUnfoldFill } from 'react-icons/ri';

import { ContactsModal } from '@/components';
import {
  AdminsIcon,
  ArrowRightIcon,
  BankIcon,
  DarkIcon,
  FactoryIcon,
  GroupsIcon,
  LightIcon,
  QuestionIcon,
} from '@/components/icons';
import env from '@/config/env';
import { useTheme } from '@/contexts';
import { usePoaGetAdmin } from '@/hooks';
import { useGroupsByAdmin } from '@/hooks';
import { getRealLogo } from '@/utils';

import { WalletSection } from '../wallet';

export default function MobileNav() {
  const { address } = useChain(env.chain);

  const { poaAdmin } = usePoaGetAdmin();

  const { groupByAdmin } = useGroupsByAdmin(
    poaAdmin ?? 'manifest1afk9zr2hn2jsac63h4hm60vl9z3e5u69gndzf7c99cqge3vzwjzsfmy9qj'
  );

  const group = groupByAdmin?.groups?.[0];

  const isMember = group?.members?.some(member => member?.member?.address === address);

  const closeDrawer = () => {
    const drawer = document.getElementById('my-drawer') as HTMLInputElement;
    if (drawer) drawer.checked = false;
  };

  const NavItem: React.FC<{
    Icon: React.ComponentType<{ className?: string }>;
    href: string;
    label: string;
  }> = ({ Icon, href, label }) => {
    return (
      <li>
        <Link href={href} legacyBehavior>
          <div
            onClick={closeDrawer}
            className="flex flex-row justify-start items-center transition-all duration-300 ease-in-out text-primary"
          >
            <Icon className="w-8 h-8" />
            <span className="text-2xl">{label}</span>
          </div>
        </Link>
      </li>
    );
  };

  const { toggleTheme, theme } = useTheme();
  const [isContactsOpen, setContactsOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 p-3 bg-base-300 flex lg:hidden flex-row justify-between items-center">
        <Image
          src={getRealLogo('/manifest', theme === 'dark')}
          height={100}
          width={100}
          alt="manifest"
        />
        <label htmlFor="my-drawer" className="btn btn-sm btn-primary drawer-button">
          <RiMenuUnfoldFill fontSize={'24px'} />
        </label>
      </div>
      <div className="drawer z-50 lg:hidden">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-side min-h-screen h-full ">
          <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          <ul className="menu p-4 w-80 min-h-full bg-[#F4F4FF] dark:bg-[#1D192D] space-y-3 text-base-content flex flex-col">
            <div className="flex flex-row justify-between items-center">
              <div className="flex flex-row gap-4 justify-between items-center">
                <Image
                  src={getRealLogo('/logo', theme === 'dark')}
                  alt="logo"
                  width={55}
                  height={55}
                />
                <div className="flex flex-col">
                  <p className="text-2xl leading-tight text-balance">Alberto</p>
                  {env.chainTier === 'mainnet' ? null : (
                    <p className="text-md uppercase">{env.chainTier}</p>
                  )}
                </div>
              </div>

              {/* Updated Theme Toggle */}
              <div className="flex flex-row items-center gap-2">
                <Link
                  href="https://docs.manifestai.org/"
                  target="_blank"
                  className="tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
                  data-tip="Help Guide"
                >
                  <QuestionIcon className={`w-8 h-8 rounded-xl text-primary`} />
                </Link>
                <label className="swap swap-rotate text-primary">
                  <input
                    type="checkbox"
                    className="theme-controller hidden"
                    value="dark"
                    checked={theme === 'dark'}
                    onChange={() => toggleTheme()}
                  />
                  <DarkIcon className="swap-on fill-current w-9 h-9 duration-300" />
                  <LightIcon className="swap-off fill-current w-9 h-9 duration-300" />
                </label>
              </div>
            </div>
            <div className="divider divider-horizon"></div>
            <NavItem Icon={MdHome} href="/" label="Home" />
            <NavItem Icon={BankIcon} href="/bank" label="Bank" />
            <NavItem Icon={GroupsIcon} href="/groups" label="Groups" />
            {isMember && <NavItem Icon={AdminsIcon} href="/admins" label="Admin" />}
            <NavItem Icon={FactoryIcon} href="/factory" label="Factory" />

            <div className="divider divider-horizon"></div>

            {/* Added Contacts button */}
            <li className="mb-4">
              <button
                onClick={() => {
                  setContactsOpen(true);
                }}
                className="flex flex-row justify-start items-center transition-all duration-300 ease-in-out text-primary mt-2"
              >
                <MdContacts className="w-8 h-8" />
                <span className="text-2xl">Contacts</span>
              </button>
            </li>

            <div className="justify-between items-center">
              <WalletSection chainName={env.chain} />
            </div>

            {/* Updated close button - now uses flex-1 and mt-auto to push to bottom */}
            <div className="flex justify-start mt-auto">
              <button onClick={closeDrawer} className="btn btn-sm btn-outline btn-primary">
                <ArrowRightIcon fontSize={'24px'} />
              </button>
            </div>
          </ul>
        </div>
      </div>

      <ContactsModal
        open={isContactsOpen}
        onClose={() => setContactsOpen(false)}
        selectionMode={false}
      />
    </>
  );
}
