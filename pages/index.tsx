import { useChain } from '@cosmos-kit/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { Element, Link as ScrollLink } from 'react-scroll';

import { WalletSection } from '@/components';
import { BankIcon, FactoryIcon, GroupsIcon } from '@/components/icons';
import { useIsMobile } from '@/hooks';

import env from '../config/env';

const AnimatedAsterisk = dynamic(() => import('@/components/3js/animatedAsterisk'), {
  ssr: false,
  loading: () => <LoadingIndicator />,
});

const AnimatedShape = dynamic(() => import('@/components/3js/animatedMesh'), {
  ssr: false,
  loading: () => <LoadingIndicator />,
});

function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="progress progress-primary w-56 indeterminate"></div>
    </div>
  );
}

const FadeInSection = ({
  children,
  threshold = 0.1,
}: {
  children: React.ReactNode;
  threshold?: number;
}) => {
  const [ref, inView] = useInView({
    threshold,
    triggerOnce: true,
  });

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-1000 ${inView ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const isMobile = useIsMobile();
  const { isWalletConnected } = useChain(env.chain);

  return (
    <>
      <Head>
        <title>Alberto - Blockchain App</title>
        <meta name="description" content="Alberto" />
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Alberto" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <style>{`
          html, body {
            scroll-behavior: smooth;
            scroll-snap-type: y mandatory;
          }
          section {
            scroll-snap-align: start;
            scroll-snap-stop: always;
          }
        `}</style>
      </Head>

      <div className="min-h-screen">
        {/* Main Hero */}
        <Element name="hero" id="hero">
          <section className="relative h-screen overflow-hidden">
            <div className="max-w-7xl mx-auto h-full">
              <div className="relative z-10 h-full lg:max-w-2xl lg:w-full flex items-center">
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Connect to your</span>{' '}
                      <span className="block text-primary xl:inline">Enterprise-Ready</span>{' '}
                      <span className="block xl:inline">Wallet.</span>{' '}
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      Securely manage your assets, create, and shape a future owned by its users
                      with the first chain to use audited POA.
                    </p>
                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                      <div className="flex flex-col sm:flex-row items-center gap-8">
                        {!isWalletConnected && (
                          <div className="w-full sm:w-48">
                            <WalletSection chainName={env.chain} />
                          </div>
                        )}

                        <ScrollLink
                          to="how-it-works"
                          smooth={true}
                          duration={500}
                          className="btn btn-gradient rounded-md flex items-center justify-center text-white w-full sm:w-48"
                        >
                          Why POA?
                        </ScrollLink>

                        <ScrollLink
                          to="resources"
                          smooth={true}
                          duration={500}
                          className="btn btn-gradient rounded-md flex items-center justify-center text-white w-full sm:w-48"
                        >
                          Modules
                        </ScrollLink>
                      </div>
                    </div>
                    {/* Got any questions section */}
                    <div className="mt-10 w-full">
                      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-left border border-primary/20">
                        <h3 className="text-2xl font-bold mb-4">Got any questions?</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                          Need help getting started or want to learn more about Alberto Wallet?
                          Check out our comprehensive documentation for guides, tutorials, and FAQ.
                        </p>
                        <Link
                          href="https://docs.manifestai.org/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full"
                        >
                          <button className="btn btn-gradient w-full rounded-md text-white px-8 py-3 inline-flex items-center gap-2 hover:scale-105 transition-transform duration-200">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                              />
                            </svg>
                            View Documentation
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
            <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
              <div className="h-56 w-full sm:h-72 md:h-80 lg:h-full lg:w-full ">
                {!isMobile && <AnimatedShape shape="icosahedron" />}
              </div>
            </div>
          </section>
        </Element>

        <FadeInSection>
          <Element name="how-it-works" id="how-it-works">
            <section className="min-h-screen py-20 sm:py-24 md:py-28 lg:py-32 relative overflow-hidden flex items-center justify-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-4 gap-20 items-center">
                  <div className="order-1 col-span-4 hidden lg:block lg:col-span-1">
                    <div className="flex flex-col items-center mb-12">
                      <div className="w-full flex justify-center">
                        <Image
                          src="/logo.svg" // Replace with your actual image path
                          alt="Manifest Logo"
                          width={200}
                          height={200}
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold mt-4 font-mono text-right">
                      ENHANCED SECURITY
                    </h2>
                    <h2 className="text-2xl font-bold mt-4 font-mono text-right">
                      NETWORK EFFICIENCY
                    </h2>
                    <h2 className="text-2xl font-bold mt-4 font-mono text-right">SCALABILITY</h2>
                    <h2 className="text-2xl font-bold mt-4 font-mono text-right">
                      ENERGY EFFICIENCY
                    </h2>
                  </div>

                  <div className="order-2 col-span-4 lg:col-span-3">
                    <h1 className="text-2xl tracking-tight font-extrabold smV:text-5xl md:text-6xl">
                      <span className="block">Proof-of-Authority (POA):</span>
                      <span className="block">Securing the Network</span>
                      <span className="block">with Trusted Validators</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      The Manifest Network is the first chain to utilize the Audited
                      Proof-of-Authority Module. Proof of Authority (PoA) is a consensus mechanism
                      that relies on trusted validators to secure the network.
                    </p>

                    <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      These validators are carefully selected based on their reputation and
                      commitment to the network&#39;s success. With PoA, you can trust that the
                      network is in good hands, allowing you to focus on building and innovating on
                      the decentralized web.
                    </p>

                    <div className="flex flex-row items-center gap-8 mt-5">
                      {!isWalletConnected && (
                        <div className="w-32 sm:w-48">
                          <WalletSection chainName={env.chain} />
                        </div>
                      )}

                      <ScrollLink
                        to="resources"
                        smooth={true}
                        duration={500}
                        className="btn btn-gradient rounded-md flex items-center justify-center text-white w-32 sm:w-48"
                      >
                        Modules
                      </ScrollLink>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Element>
        </FadeInSection>

        {/*/!* Resources *!/*/}
        <FadeInSection>
          <Element name="resources" id="resources" className="pt-20 sm:pt-24 md:pt-28 lg:pt-32">
            <section className="min-h-screen py-20 sm:py-24 md:py-28 lg:py-32 relative overflow-hidden flex items-center justify-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-row justify-between items-center mb-8">
                  {!isWalletConnected && (
                    <div className="hidden lg:block">
                      <div className="w-32 sm:w-48">
                        <WalletSection chainName={env.chain} />
                      </div>
                    </div>
                  )}
                  <div className="max-w-7xl mx-auto w-full relative z-10">
                    <h1 className="text-2xl tracking-tight font-extrabold smV:text-5xl md:text-6xl text-right">
                      <span className="block">Own, Govern, and Build with</span>
                      <span className="block">robust security measures to</span>
                      <span className="block">protect your assets and data.</span>
                    </h1>
                  </div>
                </div>
                <div className="block lg:hidden">
                  {!isWalletConnected && (
                    <div className="w-full">
                      <WalletSection chainName={env.chain} />
                    </div>
                  )}
                </div>
                <p className="text-base text-gray-500 mt-8">
                  Built on the Manifest Blockchain, The Manifest Wallet is the gateway to the robust
                  infrastructure that is powering The Manifest Network. These initial modules is the
                  first step in beginning your journey to access enterprise-grade compute for Ai,
                  DePIN and DeFi projects.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-8">
                  {/* First Box */}
                  <div className="group relative text-center rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-linear-to-br hover:from-white/80 hover:to-transparent dark:hover:from-base-300/80 dark:hover:to-transparent backdrop-blur-xs bg-white/60 dark:bg-base-300/60 hover:scale-105">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                      {!isMobile && <AnimatedAsterisk />}
                    </div>
                    <div className="w-full h-full p-8 rounded-2xl backdrop-blur-xs pointer-events-none ">
                      <div className="relative z-10 pointer-events-none">
                        <h4 className="text-2l md:text-lg font-bold text-mono mb-2">
                          <span className="block">SECURE</span>
                          <span className="block">INTEROPERABLE</span>
                          <span className="block">WALLET</span>
                        </h4>
                        <div className="mt-4 pointer-events-auto">
                          <Link
                            href="/bank"
                            className="btn btn-gradient rounded-md text-white w-full mx-auto"
                          >
                            <BankIcon className="w-5 h-5" /> Bank
                          </Link>
                        </div>
                        <p className="text-gray-400 group-hover:text-black dark:group-hover:text-white mt-4">
                          Securely manage your assets, seamlessly transfer value across the Manifest
                          Network and unlock the power of interoperability with different
                          blockchains.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative text-center rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-linear-to-br hover:from-white/80 hover:to-transparent dark:hover:from-base-300/80 dark:hover:to-transparent backdrop-blur-xs bg-white/60 dark:bg-base-300/60 hover:scale-105">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                      {!isMobile && <AnimatedAsterisk />}
                    </div>
                    <div className="w-full h-full p-8 rounded-2xl backdrop-blur-xs pointer-events-none ">
                      <div className="relative z-10 pointer-events-none">
                        <h4 className="text-2l md:text-lg font-bold text-mono mb-2">
                          <span className="block">FLEXIBLE</span>
                          <span className="block">DAO-LIKE</span>
                          <span className="block">STRUCTURES</span>
                        </h4>
                        <div className="mt-4 pointer-events-auto">
                          <Link
                            href="/groups"
                            className="btn btn-gradient rounded-md text-white w-full mx-auto"
                          >
                            <GroupsIcon className="w-5 h-5" /> Groups
                          </Link>
                        </div>
                        <p className="text-gray-400 group-hover:text-black dark:group-hover:text-white mt-4">
                          Join or create organizations to collaborate with others. Pool resources,
                          make collective decisions, and unlock new possibilities together.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group relative text-center rounded-2xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:bg-linear-to-br hover:from-white/80 hover:to-transparent dark:hover:from-base-300/80 dark:hover:to-transparent backdrop-blur-xs bg-white/60 dark:bg-base-300/60 hover:scale-105">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0">
                      {!isMobile && <AnimatedAsterisk />}
                    </div>
                    <div className="w-full h-full p-8 rounded-2xl backdrop-blur-xs pointer-events-none ">
                      <div className="relative z-10 pointer-events-none">
                        <h4 className="text-2l md:text-lg font-bold text-mono mb-2">
                          <span className="block">TOKEN CREATION</span>
                          <span className="block">AND</span>
                          <span className="block">MANAGEMENT</span>
                        </h4>
                        <div className="mt-4 pointer-events-auto">
                          <Link
                            href="/factory"
                            className="btn btn-gradient rounded-md text-white w-full mx-auto"
                          >
                            <FactoryIcon className="w-5 h-5" /> Token Factory
                          </Link>
                        </div>
                        <p className="text-gray-400 group-hover:text-black dark:group-hover:text-white mt-4">
                          Easily create your own tokens on the Manifest Network. Mint, burn, and
                          manage your tokens with ease.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Element>
        </FadeInSection>
      </div>
    </>
  );
}
