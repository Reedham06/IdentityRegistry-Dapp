import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { League_Spartan } from 'next/font/google';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

const { chains, publicClient } = configureChains(
  [sepolia],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: `https://sepolia.drpc.org`,
      }),
    }),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Identity Registry DApp',
  projectId: '054f2ccdb8953bc75d68efa699e07fb0',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  weight: ['400', '700'],
});

function MyApp({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        
        {}
        <main className={leagueSpartan.className}>
          <Component {...pageProps} />
        </main>
        
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;