// export async function fetchTransactions(address) {
//   try {
//     const res = await fetch(`https://public-api.solscan.io/account/transactions?account=${address}&limit=10`, {
//       headers: { 
//         'accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (!res.ok) {
//       console.error('API request failed:', res.status, res.statusText);
//       return [];
//     }
    
//     const text = await res.text(); // Get response as text first
    
//     // Check if the response text is empty or not valid JSON
//     if (!text || text.trim() === '') {
//       console.error('Empty response from API');
//       return [];
//     }
    
//     try {
//       const data = JSON.parse(text); // Now parse the text as JSON
      
//       // Check if data is an array
//       if (!Array.isArray(data)) {
//         console.error('API did not return an array:', data);
//         return [];
//       }
      
//       return data.map(tx => ({
//         src: tx.signer?.[0] || tx.src || 'unknown',
//         dst: tx.owner || tx.dst || 'unknown',
//         blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Unknown time',
//         signature: tx.signature || 'unknown',
//         lamport: tx.lamport || 0
//       }));
//     } catch (parseError) {
//       console.error('Failed to parse JSON response:', parseError);
//       console.error('Response text:', text);
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }
// }

// export async function fetchAccountInfo(address) {
//   try {
//     const res = await fetch(`https://public-api.solscan.io/account?account=${address}`, {
//       headers: { 
//         'accept': 'application/json',
//         'Content-Type': 'application/json'
//       }
//     });
    
//     if (!res.ok) {
//       console.error('API request failed:', res.status, res.statusText);
//       return { balance: 'Error fetching balance' };
//     }
    
//     const text = await res.text();
    
//     if (!text || text.trim() === '') {
//       console.error('Empty response from API');
//       return { balance: 'No data available' };
//     }
    
//     try {
//       const data = JSON.parse(text);
//       return { 
//         balance: data.lamports ? `${(data.lamports / 1000000000).toFixed(9)} SOL` : 'No SOL balance',
//         address: data.account || address,
//         type: data.type || 'Unknown'
//       };
//     } catch (parseError) {
//       console.error('Failed to parse JSON response:', parseError);
//       return { balance: 'Error parsing data' };
//     }
//   } catch (error) {
//     console.error('Error fetching account info:', error);
//     return { balance: 'Error fetching data' };
//   }
// }



// import { 
//   Connection, 
//   PublicKey, 
//   clusterApiUrl, 
//   SystemProgram, 
//   SystemInstruction 
// } from '@solana/web3.js';

// // Initialize connection to Solana's devnet
// const connection = new Connection(clusterApiUrl('devnet'));

// // Function to fetch transactions for an address
// export async function fetchTransactions(address) {
//   try {
//     const pubKey = new PublicKey(address);
    
//     // Fetch confirmed signatures for the address (transactions)
//     const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
    
//     if (!signatures || signatures.length === 0) {
//       return [];
//     }
    
//     // Fetch transaction details for each signature
//     const transactionPromises = signatures.map(async (signatureInfo) => {
//       try {
//         const tx = await connection.getTransaction(signatureInfo.signature);
        
//         if (!tx) return null;
        
//         // Get all accounts involved in the transaction
//         const accounts = tx.transaction.message.accountKeys;
        
//         // For simplicity, we'll consider the first account as source and search for transfers
//         const source = accounts[0].toBase58();
//         let destination = '';
//         let amount = 0;
        
//         // Look through instructions to find transfers
//         if (tx.meta && tx.meta.innerInstructions) {
//           for (const innerInst of tx.meta.innerInstructions) {
//             for (const inst of innerInst.instructions) {
//               // This is a simplified approach - would need more logic for token transfers
//               if (inst.program === 'system' && inst.parsed?.type === 'transfer') {
//                 destination = inst.parsed.info.destination;
//                 amount = inst.parsed.info.lamports;
//                 break;
//               }
//             }
//           }
//         }
        
//         // If no inner instructions had transfers, check main instructions
//         if (!destination && tx.transaction.message.instructions) {
//           for (const inst of tx.transaction.message.instructions) {
//             // For system transfers, we can identify the destination account
//             if (inst.programId.equals(SystemProgram.programId)) {
//               const decoded = SystemInstruction.decodeTransfer(inst);
//               if (decoded) {
//                 destination = decoded.toPubkey.toBase58();
//                 amount = decoded.lamports;
//                 break;
//               }
//             }
//           }
//         }
        
//         // If we still don't have a destination, use the second account as fallback
//         if (!destination && accounts.length > 1) {
//           destination = accounts[1].toBase58();
//         }
        
//         return {
//           signature: signatureInfo.signature,
//           src: source,
//           dst: destination || 'unknown',
//           blockTime: new Date(signatureInfo.blockTime * 1000).toLocaleString(),
//           lamport: amount,
//           slot: signatureInfo.slot
//         };
//       } catch (txError) {
//         console.error(`Error fetching transaction ${signatureInfo.signature}:`, txError);
//         return null;
//       }
//     });
    
//     const transactions = await Promise.all(transactionPromises);
//     return transactions.filter(tx => tx !== null);
    
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }
// }

// // Function to fetch account information
// export async function fetchAccountInfo(address) {
//   try {
//     const pubKey = new PublicKey(address);
    
//     // Fetch the account info
//     const accountInfo = await connection.getAccountInfo(pubKey);
    
//     if (!accountInfo) {
//       return { balance: 'Account not found' };
//     }
    
//     // Fetch the SOL balance
//     const balance = await connection.getBalance(pubKey);
    
//     return {
//       balance: `${(balance / 1000000000).toFixed(9)} SOL`,
//       address: address,
//       type: getAccountType(accountInfo),
//       executable: accountInfo.executable,
//       owner: accountInfo.owner.toBase58()
//     };
    
//   } catch (error) {
//     console.error('Error fetching account info:', error);
//     return { balance: 'Error fetching balance' };
//   }
// }

// // Helper function to determine account type based on its properties
// function getAccountType(accountInfo) {
//   if (accountInfo.executable) {
//     return 'Program';
//   }
  
//   // Check for known program IDs
//   const owner = accountInfo.owner.toBase58();
  
//   // System program owns SOL accounts
//   if (owner === '11111111111111111111111111111111') {
//     return 'System Account';
//   }
  
//   // Token program
//   if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
//     return 'Token Account';
//   }
  
//   return 'Unknown';
// }


// import { 
//   Connection, 
//   PublicKey, 
//   clusterApiUrl, 
//   SystemProgram 
// } from '@solana/web3.js';

// // Initialize connection to Solana's devnet
// const connection = new Connection(clusterApiUrl('devnet'));

// // Function to fetch transactions for an address
// export async function fetchTransactions(address) {
//   try {
//     const pubKey = new PublicKey(address);
    
//     // Fetch confirmed signatures for the address (transactions)
//     const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
    
//     if (!signatures || signatures.length === 0) {
//       return [];
//     }
    
//     // Fetch transaction details for each signature
//     const transactionPromises = signatures.map(async (signatureInfo) => {
//       try {
//         const tx = await connection.getTransaction(signatureInfo.signature);
        
//         if (!tx) return null;
        
//         // Get all accounts involved in the transaction
//         const accounts = tx.transaction.message.accountKeys.map(key => key.toBase58());
        
//         // For simplicity, we'll consider the first account as source 
//         const source = accounts[0];
//         let destination = '';
//         let amount = 0;
        
//         // Look through post token balances to find transfers (if available)
//         if (tx.meta && tx.meta.postTokenBalances && tx.meta.preTokenBalances) {
//           // Token transfer logic would go here
//         }
        
//         // For system transfers, check program instructions
//         if (tx.meta && tx.transaction.message.instructions) {
//           for (const inst of tx.transaction.message.instructions) {
//             // Check if it's a system program instruction
//             if (inst.programId && inst.programId.equals(SystemProgram.programId)) {
//               // This is likely a SOL transfer
//               // We'll use the first non-source account as destination in this simplified approach
//               for (let i = 1; i < accounts.length; i++) {
//                 if (accounts[i] !== source) {
//                   destination = accounts[i];
//                   break;
//                 }
//               }
              
//               // Try to extract amount from transaction meta
//               if (tx.meta && tx.meta.postBalances && tx.meta.preBalances) {
//                 // For simple transfers, the amount is the difference in balances
//                 const sourceIndex = accounts.indexOf(source);
//                 if (sourceIndex >= 0 && sourceIndex < tx.meta.preBalances.length) {
//                   amount = tx.meta.preBalances[sourceIndex] - tx.meta.postBalances[sourceIndex];
//                   if (amount < 0) amount = 0; // Avoid negative amounts
//                 }
//               }
//             }
//           }
//         }
        
//         // If we still don't have a destination, use the second account as fallback
//         if (!destination && accounts.length > 1) {
//           destination = accounts[1];
//         }
        
//         return {
//           signature: signatureInfo.signature,
//           src: source,
//           dst: destination || 'unknown',
//           blockTime: signatureInfo.blockTime ? new Date(signatureInfo.blockTime * 1000).toLocaleString() : 'unknown',
//           lamport: amount,
//           slot: signatureInfo.slot
//         };
//       } catch (txError) {
//         console.error(`Error fetching transaction ${signatureInfo.signature}:`, txError);
//         return null;
//       }
//     });
    
//     const transactions = await Promise.all(transactionPromises);
//     return transactions.filter(tx => tx !== null);
    
//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     return [];
//   }
// }

// // Function to fetch account information
// export async function fetchAccountInfo(address) {
//   try {
//     const pubKey = new PublicKey(address);
    
//     // Fetch the account info
//     const accountInfo = await connection.getAccountInfo(pubKey);
    
//     if (!accountInfo) {
//       return { balance: 'Account not found' };
//     }
    
//     // Fetch the SOL balance
//     const balance = await connection.getBalance(pubKey);
    
//     return {
//       balance: `${(balance / 1000000000).toFixed(9)} SOL`,
//       address: address,
//       type: getAccountType(accountInfo),
//       executable: accountInfo.executable,
//       owner: accountInfo.owner.toBase58()
//     };
    
//   } catch (error) {
//     console.error('Error fetching account info:', error);
//     return { balance: 'Error fetching balance' };
//   }
// }

// // Helper function to determine account type based on its properties
// function getAccountType(accountInfo) {
//   if (accountInfo.executable) {
//     return 'Program';
//   }
  
//   // Check for known program IDs
//   const owner = accountInfo.owner.toBase58();
  
//   // System program owns SOL accounts
//   if (owner === '11111111111111111111111111111111') {
//     return 'System Account';
//   }
  
//   // Token program
//   if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
//     return 'Token Account';
//   }
  
//   return 'Unknown';
// }


// import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
// import axios from 'axios';

// // Initialize connection to Solana's mainnet
// const connection = new Connection(clusterApiUrl('mainnet-beta'));

// // Solscan API base URL
// const SOLSCAN_API_BASE = 'https://public-api.solscan.io';

// // Function to fetch recent transactions from Solscan API
// export async function fetchLiveTransactions(limit = 20) {
//   try {
//     // Fetch latest transactions from Solscan API
//     const response = await axios.get(`${SOLSCAN_API_BASE}/transaction/last`, {
//       params: { limit },
//       headers: {
//         'accept': 'application/json',
//         'user-agent': 'Mozilla/5.0'
//       }
//     });
    
//     if (!response.data || !Array.isArray(response.data)) {
//       console.error('Invalid response from Solscan API:', response.data);
//       return [];
//     }
    
//     // Extract and format transaction data
//     const transactions = response.data.map(tx => {
//       try {
//         return {
//           signature: tx.txHash,
//           src: tx.signer && tx.signer.length > 0 ? tx.signer[0] : tx.fee?.payer || 'unknown',
//           dst: tx.mainActions && tx.mainActions.length > 0 && tx.mainActions[0].dst ? 
//                 tx.mainActions[0].dst : 'unknown',
//           blockTime: new Date(tx.blockTime * 1000).toLocaleString(),
//           lamport: tx.mainActions && tx.mainActions.length > 0 ? 
//                   tx.mainActions[0].lamport || 0 : 0,
//           slot: tx.slot,
//           status: tx.status
//         };
//       } catch (err) {
//         console.error('Error processing transaction:', err, tx);
//         return null;
//       }
//     });
    
//     return transactions.filter(tx => tx !== null);
    
//   } catch (error) {
//     console.error('Error fetching live transactions from Solscan:', error);
//     return [];
//   }
// }

// // Function to fetch transaction details from Solscan API
// export async function fetchTransactionDetails(signature) {
//   try {
//     const response = await axios.get(`${SOLSCAN_API_BASE}/transaction/${signature}`, {
//       headers: {
//         'accept': 'application/json',
//         'user-agent': 'Mozilla/5.0'
//       }
//     });
    
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching transaction details for ${signature}:`, error);
//     return null;
//   }
// }

// // Function to fetch account info from Solscan API
// export async function fetchAccountInfo(address) {
//   try {
//     // First try to get account info from Solscan API
//     const response = await axios.get(`${SOLSCAN_API_BASE}/account/${address}`, {
//       headers: {
//         'accept': 'application/json',
//         'user-agent': 'Mozilla/5.0'
//       }
//     });
    
//     if (!response.data) {
//       throw new Error('No data returned from Solscan API');
//     }
    
//     // Format the response data
//     return {
//       address: address,
//       balance: response.data.lamports ? 
//                `${(response.data.lamports / 1000000000).toFixed(9)} SOL` : 
//                'Unknown',
//       type: getAccountType(response.data),
//       executable: response.data.executable || false,
//       owner: response.data.owner || 'Unknown'
//     };
    
//   } catch (error) {
//     console.error(`Error fetching account info for ${address} from Solscan:`, error);
    
//     // Fallback to Solana RPC if Solscan API fails
//     try {
//       const pubKey = new PublicKey(address);
//       const accountInfo = await connection.getAccountInfo(pubKey);
//       const balance = await connection.getBalance(pubKey);
      
//       return {
//         address: address,
//         balance: `${(balance / 1000000000).toFixed(9)} SOL`,
//         type: accountInfo ? getAccountTypeFromOnchain(accountInfo) : 'Unknown',
//         executable: accountInfo ? accountInfo.executable : false,
//         owner: accountInfo ? accountInfo.owner.toBase58() : 'Unknown'
//       };
//     } catch (rpcError) {
//       console.error(`Fallback RPC call also failed for ${address}:`, rpcError);
//       return {
//         address: address,
//         balance: 'Error fetching balance',
//         type: 'Unknown',
//         executable: false,
//         owner: 'Unknown'
//       };
//     }
//   }
// }

// // Helper function to determine account type based on Solscan data
// function getAccountType(accountData) {
//   if (accountData.executable) {
//     return 'Program';
//   }
  
//   if (accountData.tokenInfo) {
//     return 'Token Account';
//   }
  
//   const owner = accountData.owner;
  
//   // System program owns SOL accounts
//   if (owner === '11111111111111111111111111111111') {
//     return 'System Account';
//   }
  
//   // Token program
//   if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
//     return 'Token Account';
//   }
  
//   return 'Unknown';
// }

// // Helper function to determine account type based on onchain data
// function getAccountTypeFromOnchain(accountInfo) {
//   if (accountInfo.executable) {
//     return 'Program';
//   }
  
//   const owner = accountInfo.owner.toBase58();
  
//   // System program owns SOL accounts
//   if (owner === '11111111111111111111111111111111') {
//     return 'System Account';
//   }
  
//   // Token program
//   if (owner === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
//     return 'Token Account';
//   }
  
//   return 'Unknown';
// }



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

