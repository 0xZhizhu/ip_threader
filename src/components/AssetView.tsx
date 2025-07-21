'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { threadedIpABI } from '../lib/abi'; 
import axios from 'axios';
import { parseEther } from 'viem';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface NftMetadata {
  name: string;
  description: string;
  image: string;
}

type ContractLicenseData = [bigint, boolean]; 

// IMPORTANT: This MUST be your VM's Public IP Address (e.g., 'http://34.47.170.96')
// Nginx is on port 80, so no explicit port number needed here.
const VPS_BASE_URL = 'http://34.47.170.96'; // <--- REPLACE THIS WITH YOUR VM'S IP

export function AssetView({ id }: { id: string }) {
  const { isConnected } = useAccount();
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [sentinelStatus, setSentinelStatus] = useState({ matchFound: false, tokenId: -1 }); 
  const [isScanning, setIsScanning] = useState(false); 

  console.log("AssetView: Component rendered for ID:", id); 

  const { 
    data: tokenURI, 
    isLoading: isUriLoading, 
    error: tokenURIError,
    isFetched: isTokenURIFetched
  } = useReadContract({
    address: contractAddress,
    abi: threadedIpABI,
    functionName: 'tokenURI',
    args: [BigInt(id)],
    query: {
        enabled: !!id, 
        staleTime: Infinity, 
    }
  });

  const { 
    data: licenseData, 
    isLoading: isLicenseLoading, 
    error: licenseError,
    isFetched: isLicenseFetched
  } = useReadContract({
    address: contractAddress,
    abi: threadedIpABI,
    functionName: 'licenses',
    args: [BigInt(id)],
    query: {
        enabled: !!id, 
        staleTime: Infinity, 
    }
  });

  useEffect(() => {
    console.log("AssetView useEffect (tokenURI):", "tokenURI:", tokenURI, "isTokenURIFetched:", isTokenURIFetched);
    if (tokenURI && isTokenURIFetched) {
      const fetchMetadata = async () => {
        setAssetError(null); 
        try {
          console.log("AssetView: Attempting to fetch metadata from:", tokenURI);
          const formattedUri = (tokenURI as string).replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await axios.get(formattedUri);
          console.log("AssetView: Metadata fetched successfully:", response.data);
          setMetadata(response.data);
        } catch (error: any) {
          console.error("AssetView: Failed to fetch metadata from IPFS:", error);
          setAssetError(`Failed to load IPFS metadata: ${error.message || error.toString()}`);
        }
      };
      fetchMetadata();
    } else if (isTokenURIFetched && !tokenURI && !isUriLoading) { 
        console.warn("AssetView: tokenURI fetch completed, but returned no URI for ID:", id);
        setAssetError("No IPFS URI found for this token. Does it exist?");
    }
  }, [tokenURI, isTokenURIFetched, isUriLoading, id]); 

  // NEW: useEffect to periodically fetch sentinel status from VPS (via Nginx on port 80)
  useEffect(() => {
    const fetchSentinelStatus = async () => {
      try {
        console.log("AssetView: Attempting to fetch sentinel status from VPS for ID:", id);
        // Fetch from your VPS endpoint now (via Nginx on port 80)
        const response = await fetch(`${VPS_BASE_URL}/status.json`); // <--- USE VPS_BASE_URL HERE
        const data = await response.json();
        console.log("AssetView: Sentinel status data from VPS:", data);
        if (data.tokenId === Number(id)) {
          setSentinelStatus(data);
        } else {
            setSentinelStatus({ matchFound: false, tokenId: Number(id) });
        }
      } catch (error) { 
        console.error("AssetView: Could not fetch sentinel status from VPS (expected if server down/file missing):", error); 
        setSentinelStatus({ matchFound: false, tokenId: Number(id) }); 
      }
    };

    fetchSentinelStatus(); 
    const interval = setInterval(fetchSentinelStatus, 5000); 

    return () => clearInterval(interval); 
  }, [id]);


  // NEW: Handle "Scan for Derivatives" button click - calls VPS API (via Nginx on port 80)
  const handleScanForDerivatives = async () => {
    setIsScanning(true);
    setAssetError(null); 
    try {
        console.log(`AssetView: Triggering sentinel scan via VPS for Token ID ${id}...`);
        const response = await axios.post(`${VPS_BASE_URL}/trigger-sentinel`, { tokenId: Number(id) }); // <--- USE VPS_BASE_URL HERE
        console.log('VPS API response:', response.data);
        alert(`Scan initiated for Token ID ${id}. Badge will appear if detected.`);
    } catch (error: any) {
        console.error("AssetView: Failed to trigger sentinel API on VPS:", error);
        setAssetError(`Failed to trigger scan on VPS: ${error.response?.data?.error || error.message}`);
    } finally {
        setIsScanning(false);
    }
  };


  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const handleLicense = () => {
    setAssetError(null); 
    if (!isConnected) {
      alert('Please connect your wallet to license this IP.');
      return;
    }
    const currentLicense: ContractLicenseData | undefined = licenseData as ContractLicenseData;

    if (!currentLicense) {
        console.error("AssetView: License data not available when attempting to license.");
        setAssetError("License data not loaded. Please try again.");
        return;
    }

    const [commercialFee, allowsCommercialUse] = currentLicense; 

    if (!allowsCommercialUse) {
        setAssetError('This IP is not available for a commercial license.');
        return;
    }

    if (Number(commercialFee) === 0) {
        setAssetError('This IP has a zero commercial fee. No transaction needed.');
        return;
    }

    console.log("AssetView: Initiating license transaction for ID:", id, "Fee:", Number(commercialFee) / 1e18);
    writeContract({
      address: contractAddress,
      abi: threadedIpABI,
      functionName: 'executeLicense',
      args: [BigInt(id)], 
      value: commercialFee, 
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const combinedError = 
        tokenURIError || 
        licenseError || 
        writeError || 
        confirmError;

    if (combinedError) {
        const errMessage = combinedError.message || combinedError.toString();
        setAssetError(`Error: ${errMessage}`);
        console.error("AssetView: Combined Error Detected:", combinedError);
    } else {
        setAssetError(null); 
    }
  }, [tokenURIError, licenseError, writeError, confirmError]);


  if (isUriLoading || isLicenseLoading) {
    return <p>Loading NFT data from the blockchain...</p>;
  }

  if (assetError) {
    return (
        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg text-red-400 text-center">
            <p className="font-bold mb-2">Error Loading NFT:</p>
            <p className="text-sm break-words">{assetError}</p>
            <p className="text-xs mt-4 text-gray-400">
                Check console for more details. Ensure contract address, token ID, and IPFS gateway are correct.
            </p>
        </div>
    );
  }

  if (isTokenURIFetched && !tokenURI && !assetError) {
    return (
        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg text-yellow-400 text-center">
            <p className="font-bold mb-2">NFT Not Found</p>
            <p className="text-sm">This token ID might not exist or its data is invalid.</p>
            <p className="text-xs mt-4 text-gray-400">
                Ensure you've minted this token ID and the IPFS link is valid.
            </p>
        </div>
    );
  }
  
  if (!metadata) { 
    return <p>Loading metadata...</p>;
  }
  
  if (!licenseData) { 
      return <p>Loading license data...</p>;
  }

  const [commercialFee, allowsCommercialUse] = licenseData as ContractLicenseData; 

  return (
    <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
      {metadata && <img src={metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} alt={metadata.name} className="w-full rounded-lg" />}
      {!metadata && <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400">Loading Image...</div>} 
      
      <h2 className="mt-4 text-2xl font-bold">{metadata?.name || 'Loading Name...'}</h2>
      
      {/* Sentinel Status Badge */}
      {sentinelStatus.matchFound && (
        <div className="my-4 rounded-md bg-yellow-800 p-3 text-center font-bold text-yellow-200">
          ⚠️ Potential Use Detected by Sentinel
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4"> 
        {/* NEW: Scan for Derivatives Button */}
        <button
          onClick={handleScanForDerivatives}
          disabled={isScanning}
          className="w-full rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 transition disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {isScanning ? 'Scanning...' : 'Scan for Derivatives (Sentinel)'}
        </button>

        {/* Existing License Button */}
        <button
          onClick={handleLicense}
          disabled={!allowsCommercialUse || isPending || isConfirming || Number(commercialFee) === 0} 
          className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 transition disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {Number(commercialFee) === 0 ? 'Free (Non-Commercial)' : isPending ? 'Confirm...' : isConfirming ? 'Confirming...' : `License for ${Number(commercialFee) / 1e18} CAMP`}
        </button>
        {isConfirmed && (
            <div className="mt-4 text-center text-green-400">
                <p>License Acquired Successfully!</p>
                <a href={`https://basecamp.cloud.blockscout.com/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline">
                    View on Blockscout
                </a>
            </div>
        )}
      </div>
    </div>
  );
}