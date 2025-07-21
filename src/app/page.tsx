'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { MintForm } from '../components/MintForm';
import Link from 'next/link';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [currentMintHash, setCurrentMintHash] = useState<`0x${string}` | undefined>(undefined);
  const [lastConfirmedHash, setLastConfirmedHash] = useState<`0x${string}` | undefined>(undefined);
  
  const [showMintSuccessMessage, setShowMintSuccessMessage] = useState(false);
  const [showTxPendingMessage, setShowTxPendingMessage] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoading: isConfirmingMint, isSuccess: wagmiIsMintConfirmed } = useWaitForTransactionReceipt({ 
    hash: currentMintHash,
    query: {
        enabled: !!currentMintHash,
    }
  });

  useEffect(() => {
    console.log(
      'HomePage Effect:',
      'Hash:', currentMintHash,
      'wagmiIsMintConfirmed:', wagmiIsMintConfirmed,
      'isConfirmingMint:', isConfirmingMint,
      'showMintSuccessMessage:', showMintSuccessMessage,
      'lastConfirmedHash:', lastConfirmedHash
    );
    if(publicClient){
      console.log('Public Client Connected:', publicClient.chain.name);
    } else {
      console.warn('Public Client is UNDEFINED. RPC connection might be failing.');
    }


    if (currentMintHash) {
      setShowTxPendingMessage(true);
      setShowMintSuccessMessage(false); 

      if (wagmiIsMintConfirmed) {
        console.log("HomePage: wagmiIsMintConfirmed is TRUE. Transaction is confirmed!");
        setShowMintSuccessMessage(true);
        setShowTxPendingMessage(false);
        setLastConfirmedHash(currentMintHash); 
        setCurrentMintHash(undefined); 

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        
        const timer = setTimeout(() => {
          console.log("HomePage: Hiding success message after 5 seconds.");
          setShowMintSuccessMessage(false);
          setLastConfirmedHash(undefined); 
        }, 5000); 
        return () => clearTimeout(timer);
      } else if (publicClient && !isConfirmingMint) { 
        if (!pollIntervalRef.current) {
            console.log("HomePage: Starting manual transaction polling as wagmiIsMintConfirmed is false.");
            pollIntervalRef.current = setInterval(async () => {
                if (currentMintHash) {
                    try {
                        const receipt = await publicClient.getTransactionReceipt({ hash: currentMintHash });
                        if (receipt && receipt.status === 'success') {
                            console.log("HomePage: Manual poll confirmed success! Receipt:", receipt);
                            setShowMintSuccessMessage(true);
                            setShowTxPendingMessage(false);
                            setLastConfirmedHash(currentMintHash);
                            setCurrentMintHash(undefined);

                            if (pollIntervalRef.current) {
                                clearInterval(pollIntervalRef.current);
                                pollIntervalRef.current = null;
                            }
                        }
                    } catch (pollError) {
                        console.error("HomePage: Error during manual poll:", pollError);
                    }
                }
            }, 5000); 
        }
      }
    } else {
      setShowTxPendingMessage(false);
      if (!showMintSuccessMessage && !lastConfirmedHash) { 
        setShowMintSuccessMessage(false);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentMintHash, wagmiIsMintConfirmed, isConfirmingMint, publicClient, showMintSuccessMessage, lastConfirmedHash]);

  const handleMintTxSubmitted = (txHash: `0x${string}`) => {
    console.log("HomePage: Mint transaction submitted:", txHash);
    setCurrentMintHash(txHash);
    setLastConfirmedHash(undefined); 
    setShowMintSuccessMessage(false); 
    setShowTxPendingMessage(true); 
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto flex flex-col items-center gap-8 p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">IP Thread</h1>
          <p className="text-lg text-gray-400">The Future of Creative Provenance</p>
        </div>

        {/* Wallet Connection Logic */}
        {isClient && !isConnected && (
          <button
            onClick={() => connect({ connector: injected() })}
            className="rounded-full bg-blue-600 px-6 py-2 font-bold text-white transition hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
        
        {isClient && isConnected && (
          <div key={currentMintHash || (lastConfirmedHash ? 'confirmed' : 'connected')} className="flex w-full max-w-md flex-col items-center gap-4">
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

            {!currentMintHash && !showMintSuccessMessage && !showTxPendingMessage ? ( 
                 <MintForm onMintSuccess={handleMintTxSubmitted} />
            ) : null}

            {showTxPendingMessage && currentMintHash && ( 
                <div className="text-center text-yellow-400">
                    <p>Transaction sent! Waiting for confirmation...</p>
                    <a href={`https://basecamp.cloud.blockscout.com/tx/${currentMintHash}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                        View on Blockscout
                    </a>
                </div>
            )}
            {showMintSuccessMessage && lastConfirmedHash && ( 
                <div className="text-center text-green-400">
                    <p>Minted Successfully!</p>
                    <a href={`https://basecamp.cloud.blockscout.com/tx/${lastConfirmedHash}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                        View on Blockscout
                    </a>
                </div>
            )}

            {/* NEW: Browse Sample IPs Section - Updated Links */}
            <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Browse Sample IPs</h2>
                <div className="flex justify-center gap-4">
                    {/* Link to IP #1 (example normal NFT) */}
                    <Link href="/ip/1" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition"> 
                        View IP #1
                    </Link>
                    {/* Link to IP #2 (your Sentinel Demo NFT) */}
                    <Link href="/ip/2" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition"> 
                        View IP #2 (Sentinel Demo)
                    </Link>
                </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}