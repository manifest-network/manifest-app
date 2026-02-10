import '@fontsource/manrope';
import '@interchain-ui/react/styles';
import type { AppProps } from 'next/app';
import { useContext, useEffect } from 'react';

import MobileNav from '@/components/react/mobileNav';
import RuntimeConfigLoader from '@/components/RuntimeConfigLoader';
import { ManifestAppProviders } from '@/contexts/manifestAppProviders';
import { useTheme } from '@/contexts/useTheme';
import { Web3AuthContext } from '@/contexts/web3AuthContext';
import { useLocalStorage } from '@/hooks';

import SideNav from '../components/react/sideNav';
import '../styles/globals.css';

function ManifestApp({ Component, pageProps }: AppProps) {
  const [drawer, setDrawer] = useLocalStorage('isDrawerVisible', true);

  return (
    <RuntimeConfigLoader>
      <ManifestAppProviders>
        <AppContent
          Component={Component}
          pageProps={pageProps}
          drawer={drawer}
          setDrawer={setDrawer}
        />
      </ManifestAppProviders>
    </RuntimeConfigLoader>
  );
}

// Separate component to use hooks inside the providers
interface AppContentProps {
  Component: AppProps['Component'];
  pageProps: AppProps['pageProps'];
  drawer: boolean;
  setDrawer: (value: boolean | ((val: boolean) => boolean)) => void;
}

function AppContent({ Component, pageProps, drawer, setDrawer }: AppContentProps) {
  const { theme } = useTheme();
  const { isSigning } = useContext(Web3AuthContext);

  // Add a class to the div based on the theme for Tailwind dark mode
  const themeClass = theme === 'dark' ? 'dark' : '';

  // Apply cursor directly to body element
  useEffect(() => {
    if (isSigning) {
      document.body.style.cursor = 'wait';
      document.body.style.pointerEvents = 'auto';
    } else {
      document.body.style.cursor = '';
      document.body.style.pointerEvents = '';
    }

    // Cleanup function to ensure cursor is reset
    return () => {
      document.body.style.cursor = '';
      document.body.style.pointerEvents = '';
    };
  }, [isSigning]);

  return (
    <div
      className={`flex min-h-screen bg-background-color relative ${themeClass}`}
      data-theme={theme}
      data-signing={isSigning.toString()}
    >
      <div className="hidden md:block">
        <SideNav isDrawerVisible={drawer} setDrawerVisible={setDrawer} />
      </div>

      <div
        className={`flex-1 transition-all duration-300 ease-in-out 
                    ml-0 lg:ml-36 ${drawer ? 'lg:ml-[17rem]' : ''} relative z-0`}
      >
        <div className="lg:hidden pt-12">
          <MobileNav />
        </div>
        <main className="p-6 relative z-10">
          <Component {...pageProps} />
        </main>
      </div>
    </div>
  );
}

export default ManifestApp;
