// src/app/ip/[id]/page.tsx
'use client'; // <-- ADD THIS LINE

import { AssetView } from '@/components/AssetView'; // Using alias
import { notFound } from 'next/navigation'; // Import notFound
import { useParams } from 'next/navigation'; // Import useParams for client components

export default function AssetPage() {
    // Correct: Use useParams hook in client component to get route parameters
    const params = useParams();
    const id = params.id as string; // Assert as string, as useParams can return string | string[]

    // Optional: Basic validation for the ID.
    if (!id || typeof id !== 'string' || isNaN(Number(id))) { // Check for valid string number
        console.warn(`Invalid ID received for asset page: ${id}`);
        // Consider handling this with a redirect or a user-friendly message
        notFound(); // Redirect to 404 page if ID is invalid
    }

    // Pass the ID to the AssetView component
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <AssetView id={id} />
        </main>
    );
}