// src/app/api/trigger-sentinel/route.ts
import { NextResponse } from 'next/server';
import { exec } from 'child_process'; // Node.js module to run shell commands
import path from 'path'; // Node.js module to handle file paths

export async function POST(request: Request) {
    try {
        const { tokenId } = await request.json();

        if (typeof tokenId !== 'number' && typeof tokenId !== 'string') {
            return NextResponse.json({ error: 'Invalid tokenId provided' }, { status: 400 });
        }

        // Construct the path to your Python script
        // IMPORTANT: Adjust this path based on your exact project structure on your local machine
        // For hackathon, this is assuming 'sentinel-poc' is inside 'scripts' folder
        const pythonScriptPath = path.join(process.cwd(), 'scripts', 'sentinel-poc', 'sentinel.py');

        // Construct the command to run the Python script with the token ID
        // Assuming Python is in your PATH. If not, use full path like 'C:\Python310\python.exe'
        const command = `python "${pythonScriptPath}" ${tokenId}`;

        console.log(`Attempting to execute Python script: ${command}`);

        // Execute the Python script
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                // Return a server error if the script execution fails
                return NextResponse.json({ error: `Failed to trigger sentinel script: ${stderr}` }, { status: 500 });
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });

        // Return immediate success. The actual status.json update happens asynchronously.
        return NextResponse.json({ message: `Sentinel script triggered for Token ID ${tokenId}` });
    } catch (error: any) {
        console.error('API route error:', error);
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}