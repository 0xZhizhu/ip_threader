'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { MintForm } from '../../components/MintForm';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // This state ensures we only render wallet-dependent UI on the client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col items-center gap-8 p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">IP Thread</h1>
          <p className="text-lg text-gray-400">The Future of Creative Provenance</p>
        </div>

        {isClient && !isConnected && (
          <button
            onClick={() => connect({ connector: injected() })}
            className="rounded-full bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
        
        {isClient && isConnected && (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            <div className="flex w-full items-center justify-between rounded-md bg-gray-800 px-4 py-2">
              <p className="text-sm text-green-400">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <button
                onClick={() => disconnect()}
                className="rounded-full bg-red-600 px-4 py-1 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
            <MintForm />
          </div>
        )}
      </div>
    </main>
  );
}