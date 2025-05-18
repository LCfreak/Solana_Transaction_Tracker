


import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import axios from 'axios';

// Initialize connection to Solana's mainnet
const connection = new Connection(clusterApiUrl('mainnet-beta'));

// Solscan API base URL
const SOLSCAN_API_BASE = 'https://pro-api.solscan.io/v2.0/transaction/detail';

// Solscan API key
const SOLSCAN_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NDcyNzg2MTI5ODMsImVtYWlsIjoid2FycmlvcmxvcmQxOEBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NDcyNzg2MTJ9.MSjvjghGwjh0AwvHiJ35zXV8_y32v9lb3mS2upzvDGs"; // <--- Replace with your actual API key here.

if (!SOLSCAN_API_KEY) {
    console.warn('Solscan API key is not defined.  The application may not work correctly.');
    //  Don't throw an error here, allow the program to run, and let the individual functions handle the missing key.
}

/**
 * Adds the API key to the request headers.
 * @param {object} headers - The existing headers object.
 * @returns {object} A new headers object with the API key added, or the original headers if no API key.
 */
const getHeadersWithApiKey = (headers = {}) => {
    if (SOLSCAN_API_KEY) {
        return {
            ...headers,
            'api-key': SOLSCAN_API_KEY,
            'accept': 'application/json',  // Ensure these are still set
            'user-agent': 'Mozilla/5.0'
        };
    }
    return {
        ...headers,
        'accept': 'application/json',  // Ensure these are still set
        'user-agent': 'Mozilla/5.0'
    };
};

// Function to fetch recent transactions from Solscan API
export async function fetchLiveTransactions(limit = 20) {
    try {
        // Fetch latest transactions from Solscan API
        const response = await axios.get(`${SOLSCAN_API_BASE}/transaction/last`, {
            params: { limit },
            headers: getHeadersWithApiKey()
        });

        if (!response.data || !Array.isArray(response.data)) {
            console.error('Invalid response from Solscan API:', response.data);
            return [];
        }

        // Extract and format transaction data
        const transactions = response.data.map(tx => {
            try {
                return {
                    signature: tx.txHash,
                    src: tx.signer && tx.signer.length > 0 ? tx.signer[0] : tx.fee?.payer || 'unknown',
                    dst: tx.mainActions && tx.mainActions.length > 0 && tx.mainActions[0].dst ? tx.mainActions[0].dst : 'unknown',
                    blockTime: new Date(tx.blockTime * 1000).toLocaleString(),
                    lamport: tx.mainActions && tx.mainActions.length > 0 ? tx.mainActions[0].lamport || 0 : 0,
                    slot: tx.slot,
                    status: tx.status
                };
            } catch (err) {
                console.error('Error processing transaction:', err, tx);
                return null; // Filter out invalid transactions
            }
        });

        return transactions.filter(tx => tx !== null); // Remove null transactions
    } catch (error) {
        console.error('Error fetching live transactions from Solscan:', error);
        return [];
    }
}

// Function to fetch transaction details from Solscan API
export async function fetchTransactionDetails(signature) {
    try {
        const response = await axios.get(`${SOLSCAN_API_BASE}/transaction/${signature}`, {
            headers: getHeadersWithApiKey()
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching transaction details for ${signature}:`, error);
        return null;
    }
}

// Function to fetch account info from Solscan API
export async function fetchAccountInfo(address) {
    try {
        // First try to get account info from Solscan API
        const response = await axios.get(`${SOLSCAN_API_BASE}/account/${address}`, {
            headers: getHeadersWithApiKey()
        });

        if (!response.data) {
            throw new Error('No data returned from Solscan API');
        }

        // Format the response data
        const accountInfo = {
            address: address,
            balance: response.data.lamports ? (response.data.lamports / 1000000000).toFixed(9) + ' SOL' : 'Unknown',
            type: getAccountType(response.data),
            executable: response.data.executable || false,
            owner: response.data.owner || 'Unknown'
        };
        return accountInfo;

    } catch (error) {
        console.error(`Error fetching account info for ${address} from Solscan:`, error);
        // Fallback to Solana RPC if Solscan API fails
        try {
            const pubKey = new PublicKey(address);
            const accountInfo = await connection.getAccountInfo(pubKey);
            const balance = await connection.getBalance(pubKey);
            return {
                address: address,
                balance: (balance / 1000000000).toFixed(9) + ' SOL',
                type: accountInfo ? getAccountTypeFromOnchain(accountInfo) : 'Unknown',
                executable: accountInfo ? accountInfo.executable : false,
                owner: accountInfo ? accountInfo.owner.toBase58() : 'Unknown'
            };
        } catch (rpcError) {
            console.error(`Fallback RPC call also failed for ${address}:`, rpcError);
            return {
                address: address,
                balance: 'Error fetching balance',
                type: 'Unknown',
                executable: false,
                owner: 'Unknown'
            };
        }
    }
}

// Helper function to determine account type based on Solscan data
function getAccountType(accountData) {
    if (accountData.executable) {
        return 'Program';
    }
    if (accountData.tokenInfo) {
        return 'Token Account';
    }
    const owner = accountData.owner;
    // System program owns SOL accounts
    if (owner === '11111111111111111111111111111111') {
        return 'System Account';
    }
    // Token program
    if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        return 'Token Account';
    }
    return 'Unknown';
}

// Helper function to determine account type based on onchain data
function getAccountTypeFromOnchain(accountInfo) {
    if (accountInfo.executable) {
        return 'Program';
    }
    const owner = accountInfo.owner.toBase58();
    // System program owns SOL accounts
    if (owner === '11111111111111111111111111111111') {
        return 'System Account';
    }
    // Token program
    if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        return 'Token Account';
    }
    return 'Unknown';
}

