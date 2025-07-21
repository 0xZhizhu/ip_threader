'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { threadedIpABI } from '../lib/abi';

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

interface MintFormProps {
  onMintSuccess: (txHash: `0x${string}`) => void;
}

export function MintForm({ onMintSuccess }: MintFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { writeContract, data: hash, isPending: isWalletPending, error, reset: resetWriteContract } = useWriteContract({
    mutation: {
      onSuccess: (tx) => {
        console.log("Transaction submitted, hash:", tx);
      },
      onError: (err) => {
        setErrorMessage(err.message);
        setIsUploading(false);
      },
    }
  });

  const { isLoading: isConfirming, isSuccess: wagmiIsConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    console.log("Effect:", { wagmiIsConfirmed, hash, isConfirming });
    if (wagmiIsConfirmed && hash) {
      onMintSuccess(hash);
      setFile(null);
      setName('');
      setFee('');
      setIsUploading(false);
      setErrorMessage('');
      resetWriteContract();
    } else if (error) {
      setErrorMessage(error.message || 'An unknown error occurred.');
      setIsUploading(false);
    } else if (isWalletPending || isConfirming) {
      setErrorMessage('');
    }
  }, [wagmiIsConfirmed, hash, error, isWalletPending, isConfirming, resetWriteContract, onMintSuccess]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsUploading(false);

    if (!file || !name || !fee) {
      alert('Please fill out all fields and select a file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File is too large. Max size is 10MB.');
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please use PNG, JPG, or GIF.');
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Upload IMAGE to Pinata
      const imageFormData = new FormData();
      imageFormData.append('file', file);

      const imageUploadRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', imageFormData, {
        headers: {
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
        },
      });
      const imageIpfsHash = imageUploadRes.data.IpfsHash;

      // Step 2: Create and Upload METADATA to Pinata
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageIpfsHash}`;
      const metadata = { name, description: `IP Thread for ${name}`, image: imageUrl };

      const metadataUploadRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
        headers: {
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
        },
      });
      const metadataIpfsHash = metadataUploadRes.data.IpfsHash;
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`;

      // Step 3: Call the Smart Contract
      setIsUploading(false);
      writeContract({
        address: contractAddress,
        abi: threadedIpABI,
        functionName: 'mintThreadedIP',
        args: [tokenURI, parseEther(fee)],
      });
      console.log("writeContract called, hash:", hash);

    } catch (err: any) {
      console.error('Minting process failed:', err);
      const specificError = err.response?.data?.error || err.message;
      setErrorMessage(`Upload/Mint failed: ${specificError}`);
      setIsUploading(false);
    }
  };

  let buttonText = 'Mint IP Thread';
  if (isUploading) {
    buttonText = 'Uploading to IPFS...';
  } else if (isWalletPending) {
    buttonText = 'Confirm in wallet...';
  } else if (isConfirming) {
    buttonText = 'Transaction confirming...';
  }

  const isDisabled = isUploading || isWalletPending || isConfirming;

  return (
    <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* File Input */}
        <div>
          <label htmlFor="file-upload" className="mb-2 block text-sm font-medium text-gray-300">Upload Artwork</label>
          <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-600 px-6 pt-5 pb-6">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="flex text-sm text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-gray-800 font-medium text-blue-400 focus-within:outline-none hover:text-blue-500">
                  <span>{file ? file.name : 'Upload a file'}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                </label>
                {!file && <p className="pl-1">or drag and drop</p>}
              </div>
              {!file && <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>}
            </div>
          </div>
        </div>
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">Name / Description</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="block w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500" placeholder="Nova, the Star Sprinter" autoComplete="off" required />
        </div>
        {/* Fee Input */}
        <div>
          <label htmlFor="fee" className="mb-2 block text-sm font-medium text-gray-300">Commercial License Fee (CAMP)</label>
          <input type="number" id="fee" step="0.001" value={fee} onChange={(e) => setFee(e.target.value)} className="block w-full rounded-md border-gray-600 bg-gray-700 p-2.5 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500" placeholder="0.001" autoComplete="off" required />
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded-full bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-500"
        >
          {buttonText}
        </button>
        {errorMessage && <p className="text-center text-red-400">Error: {errorMessage}</p>}
      </form>
    </div>
  );
}