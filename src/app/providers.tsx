'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { defineChain } from 'viem'; // Import defineChain

// Define the BaseCAMP chain explicitly as per documentation
const basecampChain = defineChain({
  id: 123420001114, // Chain ID for BaseCAMP [cite: 1943]
  name: 'basecamp', // Network name for BaseCAMP [cite: 1943]
  nativeCurrency: { name: 'CAMP', symbol: 'CAMP', decimals: 18 }, // Currency symbol for BaseCAMP [cite: 1943]
  rpcUrls: {
    default: {
      http: ['https://rpc.basecamp.t.raas.gelato.cloud'], // RPC Endpoint for BaseCAMP [cite: 1943]
    },
  },
  blockExplorers: {
    default: { name: 'Basecamp Cloud Blockscout', url: 'https://basecamp.cloud.blockscout.com/' }, // Block Explorer URL for BaseCAMP [cite: 1943]
  },
});

const queryClient = new QueryClient();

export const config = createConfig({
  chains: [basecampChain], // ONLY include basecampChain 
  transports: {
    [basecampChain.id]: http(),
  },
  // Set a global polling interval for wagmi's internal clients for faster updates 
  pollingInterval: 3000, // Poll every 3 seconds
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}