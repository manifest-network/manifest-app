import { useChain } from '@cosmos-kit/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { useState } from 'react';
import { MdContacts, MdHome } from 'react-icons/md';

import { ContactsModal } from '@/components';
import {
  AdminsIcon,
  BankIcon,
  DarkIcon,
  FactoryIcon,
  GroupsIcon,
  LightIcon,
  QuestionIcon,
} from '@/components/icons';
import env from '@/config/env';
import { useTheme } from '@/contexts';
import { useGroupsByAdmin } from '@/hooks';
import { usePoaGetAdmin } from '@/hooks';
import { getRealLogo } from '@/utils';

import packageInfo from '../../package.json';
import { IconWallet, WalletSection } from '../wallet';

interface SideNavProps {
  isDrawerVisible: boolean;
  setDrawerVisible: (visible: boolean) => void;
}

export default function SideNav({ isDrawerVisible, setDrawerVisible }: SideNavProps) {
  const { toggleTheme, theme } = useTheme();
  const [isContactsOpen, setContactsOpen] = useState(false);
  const { address } = useChain(env.chain);

  const { poaAdmin } = usePoaGetAdmin();

  const { groupByAdmin } = useGroupsByAdmin(
    poaAdmin ?? 'manifest1afk9zr2hn2jsac63h4hm60vl9z3e5u69gndzf7c99cqge3vzwjzsfmy9qj'
  );

  const group = groupByAdmin?.groups?.[0];

  const isMember = group?.members?.some(member => member?.member?.address === address);

  const toggleDrawer = () => setDrawerVisible(!isDrawerVisible);
  const version = packageInfo.version;
  const NavItem: React.FC<{
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    href: string;
    tooltip?: string;
  }> = ({ Icon, href, tooltip }) => {
    const { pathname } = useRouter();
    const isActive = pathname === href;

    return (
      <li
        className="relative w-full flex justify-center mb-5 tooltip tooltip-primary tooltip-bottom hover:after:delay-1000 hover:before:delay-1000"
        data-tip={tooltip}
      >
        <Link href={href} passHref legacyBehavior>
          <a
            className={`group active:scale-95 hover:ring-2  hover:ring-primary flex justify-center p-3 items-center rounded-lg transition-all duration-300 ease-in-out w-18
            ${isActive ? 'text-white bg-primary' : 'text-gray-500 hover:text-primary'}`}
          >
            <div
              className={`w-8 h-8 duration-300  ${isActive ? 'text-white bg-primary' : 'text-[#00000066] dark:text-[#FFFFFF66] group-hover:text-primary'}`}
            >
              <Icon className="w-full h-full " />
            </div>
          </a>
        </Link>
      </li>
    );
  };

  const SideNav: React.FC = () => (
    <div className="overflow-y-auto z-30 py-5 px-3 w-32 bg-[#FFFFFF3D] dark:bg-[#FFFFFF0F] flex flex-col items-center h-full transition-transform duration-300 ease-in-out">
      <Link href={'/#'} passHref legacyBehavior>
        <a href="#" className="mb-12">
          <Image src={getRealLogo('/logo', theme === 'dark')} alt="logo" width={264} height={264} />
        </a>
      </Link>
      <ul className="flex flex-col items-center grow mt-8">
        <NavItem Icon={MdHome} href="/" tooltip="Home" />
        <NavItem Icon={BankIcon} href="/bank" tooltip="Bank" />
        <NavItem Icon={GroupsIcon} href="/groups" tooltip="Groups" />
        {isMember && <NavItem Icon={AdminsIcon} href="/admins" tooltip="Admin" />}
        <NavItem Icon={FactoryIcon} href="/factory" tooltip="Token Factory" />
      </ul>
      <div className="mt-auto flex flex-col items-center space-y-6 dark:bg-[#FFFFFF0F] bg-[#0000000A] rounded-lg p-4 w-[75%]">
        <div
          className="tooltip tooltip-primary tooltip-top hover:after:delay-700 hover:before:delay-700"
          data-tip="Contacts"
        >
          <button
            onClick={() => setContactsOpen(true)}
            className="relative group flex justify-center w-full text-[#00000066] dark:text-[#FFFFFF66] hover:text-primary dark:hover:text-primary transition-all duration-300 ease-in-out cursor-pointer"
          >
            <MdContacts className="w-8 h-8" />
          </button>
        </div>
        <div
          className="tooltip tooltip-top tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
          data-tip="Wallet"
        >
          <div className="flex justify-center w-full text-[#00000066] dark:text-[#FFFFFF66]">
            <IconWallet chainName={env.chain} />
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center w-1/2 h-full z-10 tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
          data-tip="Light Mode"
        >
          <div
            className="tooltip tooltip-primary text-xs tooltip-top hover:after:delay-1000 hover:before:delay-1000"
            data-tip={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          >
            <label className="swap swap-rotate text-[#00000066] dark:text-[#FFFFFF66] hover:text-primary dark:hover:text-primary transition-all duration-300 ease-in-out">
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
        <div
          className="tooltip tooltip-top tooltip-primary hover:after:delay-1000 hover:before:delay-1000"
          data-tip="Help Guide"
        >
          <div className="flex justify-center w-full text-[#00000066] dark:text-[#FFFFFF66]">
            <Link href="https://docs.manifestai.org/" target="_blank">
              <QuestionIcon
                className={`w-8 h-8 rounded-xl text-[#00000066] dark:text-[#FFFFFF66] hover:text-primary dark:hover:text-primary transition-all duration-300 ease-in-out`}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const NavDrawer: React.FC<{
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    href: string;
    label: string;
    tooltip?: string;
  }> = ({ Icon, href, label, tooltip }) => {
    const { pathname } = useRouter();
    const isActive = pathname === href;

    return (
      <li
        className="w-full mb-5 group tooltip tooltip-primary tooltip-bottom hover:after:delay-1000 hover:before:delay-1000"
        data-tip={tooltip}
      >
        <Link href={href} legacyBehavior>
          <a
            className={`flex items-center p-2 text-base font-normal rounded-lg transition duration-300 ease-in-out ${
              isActive
                ? 'bg-primary text-white'
                : 'text-[#00000066] dark:text-[#FFFFFF66]  hover:bg-[#0000000A] hover:text-primary dark:hover:text-primary dark:hover:bg-base-300'
            }`}
          >
            <Icon className="w-8 h-8 mr-6" />
            <span className="text-xl">{label}</span>
          </a>
        </Link>
      </li>
    );
  };

  const SideDrawer: React.FC = () => (
    <div className="overflow-y-auto flex flex-col h-full bg-[#F4F4FF] dark:bg-[#1D192D]  w-64 p-4">
      <div className="gap-2 justify-start ml-2 mt-2 items-center mb-12 space-x-2">
        <Link href={'/#'} passHref legacyBehavior>
          <Image
            src={getRealLogo('/manifest', theme === 'dark')}
            alt="logo"
            width={200}
            height={200}
          />
        </Link>
        <div className="flex flex-col mt-2">
          <p className="text-3xl font-bold">Alberto Wallet</p>
          {env.chainTier === 'mainnet' ? null : (
            <p className="text-md uppercase">{env.chainTier}</p>
          )}
        </div>
      </div>
      <ul className="-mt-8 p-1">
        <NavDrawer Icon={MdHome} href="/" label="Home" tooltip="Home" />
        <NavDrawer Icon={BankIcon} href="/bank" label="Bank" tooltip="Manage your assets" />
        <NavDrawer
          Icon={GroupsIcon}
          href="/groups"
          label="Groups"
          tooltip="Create and manage groups"
        />
        {isMember && (
          <NavDrawer Icon={AdminsIcon} href="/admins" label="Admins" tooltip="Manage the network" />
        )}
        <NavDrawer
          Icon={FactoryIcon}
          href="/factory"
          label="Factory"
          tooltip="Create and manage tokens"
        />
      </ul>
      <div className="mt-auto w-full">
        <div
          className="w-full tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
          data-tip="Help Guide"
        >
          <div className="w-full flex flex-col space-y-2 mb-4">
            <Link href="https://docs.manifestai.org/" target="_blank">
              <button className="flex w-full items-center p-2 text-base font-normal rounded-lg text-[#00000066] dark:text-[#FFFFFF66] hover:bg-[#0000000A] hover:text-primary dark:hover:text-primary dark:hover:bg-base-300 transition duration-300 ease-in-out cursor-pointer">
                <QuestionIcon className="w-8 h-8 mr-6" />
                <span className="text-xl">Help Guide</span>
              </button>
            </Link>
          </div>
        </div>
        <div
          className="w-full tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
          data-tip="Manage your contacts"
        >
          <div className="w-full flex flex-col space-y-2 mb-4">
            <button
              onClick={() => setContactsOpen(true)}
              className="flex w-full items-center p-2 text-base font-normal rounded-lg text-[#00000066] dark:text-[#FFFFFF66] hover:bg-[#0000000A] hover:text-primary dark:hover:text-primary dark:hover:bg-base-300 transition duration-300 ease-in-out cursor-pointer"
            >
              <MdContacts className="w-8 h-8 mr-6" />
              <span className="text-xl">Contacts</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          {/* Theme toggle */}
          <div className="relative w-full h-[3.6rem] bg-[#0000000A] dark:bg-[#FFFFFF0F] rounded-xl">
            <label className="flex items-center justify-between w-full h-full cursor-pointer">
              <input
                type="checkbox"
                className="theme-controller hidden"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => toggleTheme()}
              />
              <div
                className="flex flex-col items-center justify-center w-1/2 h-full z-10 tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
                data-tip="Light Mode"
              >
                <LightIcon
                  className={`w-8 h-8 ${theme === 'light' ? 'text-white' : 'text-gray-500'} transition-colors duration-300`}
                />
              </div>
              <div
                className="flex flex-col items-center justify-center w-1/2 h-full z-10 tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
                data-tip="Dark Mode"
              >
                <DarkIcon
                  className={`w-8 h-8 ${theme === 'dark' ? 'text-white' : 'text-gray-500'} transition-colors duration-300`}
                />
              </div>
              <span
                className={`absolute left-1 w-[calc(50%-0.5rem)] h-12 bg-primary rounded-xl transition-all duration-300 ease-in-out transform ${
                  theme === 'dark' ? 'translate-x-[calc(100%+0.5rem)]' : ''
                }`}
              />
            </label>
          </div>
        </div>

        <ul className="pt-5 pb-4">
          <div className="mx-auto w-full justify-center items-center h-full">
            <WalletSection chainName={env.chain} />
          </div>
        </ul>
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row justify-between items-center gap-3">
            <Link href="https://github.com/manifest-network/manifest-app" target="_blank">
              <p className="text-sm text-gray-500">v{version}</p>
            </Link>
          </div>
          <div className="flex flex-row justify-between items-center gap-3">
            <Link
              href="https://discord.gg/manifestai"
              target="_blank"
              className="tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
              data-tip="Discord"
            >
              <Image
                src={getRealLogo('/discord', theme === 'dark')}
                alt={'Manifest Discord'}
                width={12}
                height={12}
                className="w-4 h-4 rounded-xl"
              />
            </Link>
            <Link
              href="https://x.com/ManifestAIs"
              target="_blank"
              className="tooltip tooltip-primary tooltip-top hover:after:delay-1000 hover:before:delay-1000"
              data-tip="X"
            >
              <Image
                src={getRealLogo('/x', theme === 'dark')}
                alt={'Twitter'}
                width={12}
                height={12}
                className="w-4 h-4 rounded-xl"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside
        id="sidebar-double"
        className="fixed top-0 left-0 h-full hidden lg:flex transition-all duration-300 ease-in-out"
        aria-label="Sidebar"
      >
        <SideNav />
      </aside>
      <aside
        id="sidebar-double"
        className={`hidden lg:flex fixed top-0 left-0 h-full transform ${
          isDrawerVisible ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-500 ease-in-out`}
        aria-label="Sidebar"
      >
        <SideDrawer />
      </aside>
      <button
        onClick={toggleDrawer}
        className={`fixed top-1/2 transform -translate-y-1/2 hidden lg:block opacity-100 p-2 text-white rounded-full bg-[#C1C1CB] dark:bg-[#444151] hover:bg-primary dark:hover:bg-primary transition-all duration-500 ease-in-out ${
          isDrawerVisible ? 'left-60' : 'left-[6.8rem]'
        }`}
      >
        <svg
          className={`w-5 h-5 transition-all duration-300 ${isDrawerVisible ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          ></path>
        </svg>
      </button>

      <ContactsModal
        open={isContactsOpen}
        onClose={() => setContactsOpen(false)}
        selectionMode={false}
      />
    </>
  );
}
