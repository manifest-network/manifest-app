import env from '@/config/env';

import { WalletSection } from '../wallet';

export default function Header() {
  return (
    <header>
      <nav className="bg-base-100 border-b border-line px-4 fixed w-full lg:px-6 py-2 ">
        <div className="flex justify-end items-center mx-auto max-w-[theme(screens.6xl)]">
          {/* Log Out Button */}
          <WalletSection chainName={env.chain} />
        </div>
      </nav>
    </header>
  );
}
