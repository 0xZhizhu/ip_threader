'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { MintForm } from '../../../src/components/MintForm';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // This state ensures we only render wallet-dependent UI on the client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [lastConfirmedHash, setLastConfirmedHash] = useState<`0x${string}` | undefined>();
  const [showMintSuccessMessage, setShowMintSuccessMessage] = useState(false);

  const handleMintSuccess = (txHash: `0x${string}`) => {
    setLastConfirmedHash(txHash);
    setShowMintSuccessMessage(true);
    setTimeout(() => setShowMintSuccessMessage(false), 5000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col items-center gap-8 p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">IP Thread</h1>
          <p className="text-lg text-gray-400">The Future of Creative Provenance</p>
        </div>

        {/* --- Wallet Connection Logic --- */}
        {isClient && !isConnected && (
          // If not connected, show the connect button
          <button
            onClick={() => connect({ connector: injected() })}
            className="rounded-full bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
        
        {isClient && isConnected && (
          // If connected, show the disconnect button AND our MintForm
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
            <MintForm onMintSuccess={handleMintSuccess} />
            {showMintSuccessMessage && lastConfirmedHash && (
              <div className="text-center text-green-400">
                <p>Minted Successfully!</p>
                <a href={`https://basecamp.cloud.blockscout.com/tx/${lastConfirmedHash}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                  View on Blockscout
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}