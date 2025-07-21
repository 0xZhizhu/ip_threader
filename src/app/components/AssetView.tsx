'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { threadedIpABI } from '../../app/lib/abi';
import axios from 'axios';
import { parseEther } from 'viem';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface NftMetadata {
  name: string;
  description: string;
  image: string;
}

export function AssetView({ id }: { id: string }) {
  const { isConnected } = useAccount();
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [sentinelStatus, setSentinelStatus] = useState({ matchFound: false });

  // 1. Read the tokenURI from the smart contract
  const { data: tokenURI, isLoading: isUriLoading } = useReadContract({
    address: contractAddress,
    abi: threadedIpABI,
    functionName: 'tokenURI',
    args: [BigInt(id)],
  });

  // 2. Read the license info from the smart contract
  const { data: license, isLoading: isLicenseLoading } = useReadContract({
    address: contractAddress,
    abi: threadedIpABI,
    functionName: 'licenses',
    args: [BigInt(id)],
  });

  // 3. Fetch metadata from IPFS once the tokenURI is available
  useEffect(() => {
    if (tokenURI) {
      const fetchMetadata = async () => {
        try {
          const formattedUri = (tokenURI as string).replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await axios.get(formattedUri);
          setMetadata(response.data);
        } catch (error) {
          console.error("Failed to fetch metadata from IPFS", error);
        }
      };
      fetchMetadata();
    }
  }, [tokenURI]);

  // NEW: useEffect to fetch sentinel status
  useEffect(() => {
    const fetchSentinelStatus = async () => {
      try {
        const response = await fetch('/status.json'); // Fetches from the 'public' folder
        const data = await response.json();
        if (data.tokenId === Number(id)) {
          setSentinelStatus(data);
        }
      } catch (error) {
        console.error("Could not fetch sentinel status:", error);
      }
    };
    fetchSentinelStatus();
  }, [id]);

  // 4. Prepare the executeLicense write function
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const handleLicense = () => {
    if (!isConnected) {
      alert('Please connect your wallet to license this IP.');
      return;
    }
    if (!license) return;

    if (!license[1]) {
        alert('This IP is not available for a commercial license.');
        return;
    }

    const fee = typeof license[0] === 'bigint' ? license[0] : BigInt(0);

    writeContract({
      address: contractAddress,
      abi: threadedIpABI,
      functionName: 'executeLicense',
      args: [BigInt(id)],
      value: fee,
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  if (isUriLoading || isLicenseLoading) {
    return <p>Loading NFT data from the blockchain...</p>;
  }

  if (!metadata || !license) {
    return <p>Loading metadata...</p>;
  }

  // Extract and type-check license data
  const commercialFee = typeof license[0] === 'bigint' ? license[0] : BigInt(0);
  const allowsCommercialUse = Boolean(license[1]);

  return (
    <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
      <img src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} alt={metadata.name} className="w-full rounded-lg" />
      <h2 className="mt-4 text-2xl font-bold">{metadata.name}</h2>
      
      {/* Sentinel Status Badge */}
      {sentinelStatus.matchFound && (
        <div className="my-4 rounded-md bg-yellow-800 p-3 text-center font-bold text-yellow-200">
          ⚠️ Potential Use Detected by Sentinel
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleLicense}
          disabled={!allowsCommercialUse || isPending || isConfirming}
          className="w-full rounded-full bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {isPending ? 'Confirm...' : isConfirming ? 'Confirming...' : `License for ${Number(commercialFee) / 1e18} CAMP`}
        </button>
        {isConfirmed && (
            <div className="mt-4 text-center text-green-400">
                <p>License Acquired Successfully!</p>
                <a href={`https://basecamp.cloud.blockscout.com/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                    View on Blockscout
                </a>
            </div>
        )}
        {error && <p className="text-center text-red-400">Error: {error.message}</p>}
      </div>
    </div>
  );
}