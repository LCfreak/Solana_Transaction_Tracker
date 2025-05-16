// import React, { useEffect, useState } from 'react'
// import { useParams } from 'react-router-dom';
// import {fetchAccountInfo, fetchTransactions} from "../utils/solanaAPI";
// import {getNickname, setNickname } from "../utils/nicknameUtils";



// export default function usePage () {
//     const { address } = useParams();
//     const [balance, setBalance] = useState(null);
//     const [ transactions, setTransactions] = useState([]);
//     const [ nickname , setNicknameInput] = useState(getNickname(address));


//     useEffect (() => {
//         async function loadData() {
//       const info = await fetchAccountInfo(address);
//       const txs = await fetchTransactions(address);
//       setBalance(info.balance);
//       setTransactions(txs);
//     }
//     loadData();
//   }, [address]);

//   const handleSave = () => {
//     setNickname(address, nickname);
//     alert('Nickname saved!');
//   };

//   return (
//     <div className="p-4">
//       <h2 className="text-xl font-bold">Account Details</h2>
//       <p><strong>Address:</strong> {address}</p>
//       <p><strong>Nickname:</strong> {getNickname(address)}</p>
//       <input
//         type="text"
//         value={nickname}
//         onChange={(e) => setNicknameInput(e.target.value)}
//         className="border p-1 mr-2"
//       />
//       <button onClick={handleSave} className="bg-blue-500 text-white px-2 py-1">Save Nickname</button>
//       <h3 className="text-lg mt-4">Balance: {balance || 'Loading...'}</h3>
//       <h4 className="text-md mt-2">Recent Transactions:</h4>
//       <ul>
//         {transactions.map((tx, i) => (
//           <li key={i}>From: {tx.src} → To: {tx.dst} | Time: {tx.blockTime}</li>
//         ))}
//       </ul>
//     </div>
//   );






// }\

// import React, { useEffect, useState } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { fetchTransactions, fetchAccountInfo } from '../utils/solanaAPI';
// import { getNickname, setNickname } from '../utils/nicknameUtils';

// export default function UserPage() {
//   const { address } = useParams();
//   const [transactions, setTransactions] = useState([]);
//   const [accountInfo, setAccountInfo] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [nickname, setNicknameState] = useState('');
//   const [inputNickname, setInputNickname] = useState('');

//   useEffect(() => {
//     async function loadData() {
//       try {
//         setLoading(true);
        
//         // Fetch account info and transactions in parallel
//         const [txs, info] = await Promise.all([
//           fetchTransactions(address),
//           fetchAccountInfo(address)
//         ]);
        
//         setTransactions(txs);
//         setAccountInfo(info);
        
//         // Get saved nickname if it exists
//         const savedNickname = getNickname(address);
//         if (savedNickname) {
//           setNicknameState(savedNickname);
//           setInputNickname(savedNickname);
//         }
        
//         setLoading(false);
//       } catch (err) {
//         console.error('Error loading account data:', err);
//         setError('Failed to load account data');
//         setLoading(false);
//       }
//     }
    
//     if (address) {
//       loadData();
//     }
//   }, [address]);

//   // Handle saving the nickname
//   const handleSaveNickname = () => {
//     if (inputNickname.trim()) {
//       setNickname(address, inputNickname);
//       setNicknameState(inputNickname);
//       alert('Nickname saved successfully!');
//     }
//   };

//   // Function to shorten address for display
//   const shortenAddress = (addr) => {
//     if (!addr || addr === 'unknown') return 'Unknown';
//     return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
//   };

//   if (loading) {
//     return <div className="flex justify-center items-center h-screen">Loading account data...</div>;
//   }

//   if (error) {
//     return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
//   }

//   return (
//     <div className="p-4 max-w-4xl mx-auto">
//       <Link to="/" className="text-blue-500 hover:text-blue-700 mb-4 block">
//         &larr; Back to Transaction Graph
//       </Link>
      
//       <div className="bg-white shadow-md rounded-lg p-6 mb-6">
//         <h1 className="text-2xl font-bold mb-2">Account Details</h1>
//         <div className="flex items-center mb-4">
//           <span className="font-mono text-sm bg-gray-100 p-2 rounded mr-2">
//             {address}
//           </span>
//           <button 
//             onClick={() => navigator.clipboard.writeText(address)}
//             className="text-sm text-blue-500 hover:text-blue-700"
//           >
//             Copy
//           </button>
//         </div>
        
//         {/* Nickname Setting */}
//         <div className="mb-6 p-4 bg-gray-50 rounded-md">
//           <h2 className="text-lg font-semibold mb-2">Account Nickname</h2>
//           {nickname && (
//             <div className="mb-2">
//               <span className="font-medium">Current Nickname:</span> {nickname}
//             </div>
//           )}
//           <div className="flex">
//             <input
//               type="text"
//               value={inputNickname}
//               onChange={(e) => setInputNickname(e.target.value)}
//               placeholder="Enter a nickname for this address"
//               className="flex-grow border p-2 rounded-l"
//             />
//             <button
//               onClick={handleSaveNickname}
//               className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
//             >
//               Save
//             </button>
//           </div>
//         </div>
        
//         {/* Account Information */}
//         {accountInfo && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//             <div className="bg-gray-50 p-4 rounded-md">
//               <h3 className="font-semibold mb-2">Balance</h3>
//               <p>{accountInfo.balance}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-md">
//               <h3 className="font-semibold mb-2">Account Type</h3>
//               <p>{accountInfo.type || 'Standard Account'}</p>
//             </div>
//           </div>
//         )}
//       </div>
      
//       {/* Transaction History */}
//       <div className="bg-white shadow-md rounded-lg p-6">
//         <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        
//         {transactions.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full bg-white">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="px-4 py-2 text-left">Source</th>
//                   <th className="px-4 py-2 text-left">Destination</th>
//                   <th className="px-4 py-2 text-left">Time</th>
//                   <th className="px-4 py-2 text-right">Amount</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {transactions.map((tx, index) => (
//                   <tr key={index} className="border-t">
//                     <td className="px-4 py-2 font-mono text-sm">
//                       {getNickname(tx.src) || shortenAddress(tx.src)}
//                     </td>
//                     <td className="px-4 py-2 font-mono text-sm">
//                       {getNickname(tx.dst) || shortenAddress(tx.dst)}
//                     </td>
//                     <td className="px-4 py-2 text-sm">{tx.blockTime}</td>
//                     <td className="px-4 py-2 text-right">
//                       {tx.lamport > 0 ? `${(tx.lamport / 1000000000).toFixed(9)} SOL` : '-'}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center p-4 text-gray-500">No transaction history available</div>
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAccountInfo, fetchTransactionDetails } from '../utils/solanaAPI';

export default function UserPage() {
  const { address } = useParams();
  const [accountInfo, setAccountInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch account info and transactions simultaneously
        const [accountData, transactionsData] = await Promise.all([
          fetchAccountInfo(address),
          fetchTransactionDetails(address)
        ]);
        
        setAccountInfo(accountData);
        setTransactions(transactionsData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading account data:', err);
        setError('Failed to load account data');
        setLoading(false);
      }
    }
    
    if (address) {
      loadData();
    }
  }, [address]);

  // Helper function to shorten address for display
  const shortenAddress = (addr) => {
    if (!addr || addr === 'unknown') return 'Unknown';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading account data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/" className="text-blue-500 hover:text-blue-700">
          &larr; Back to Transaction Visualizer
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Link to="/" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
        &larr; Back to Transaction Visualizer
      </Link>
      
      <h1 className="text-2xl font-bold mb-4">Account Details</h1>
      
      {accountInfo && (
        <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Account Information
            </h2>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                  {address}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Balance</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {accountInfo.balance}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {accountInfo.type}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">
                  {accountInfo.owner}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Executable</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {accountInfo.executable ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Signature</th>
                <th className="py-2 px-4 border-b text-left">From</th>
                <th className="py-2 px-4 border-b text-left">To</th>
                <th className="py-2 px-4 border-b text-left">Amount (SOL)</th>
                <th className="py-2 px-4 border-b text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.signature} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">
                    <a 
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {tx.signature.substring(0, 10)}...
                    </a>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link to={`/user/${tx.src}`} className="text-blue-500 hover:text-blue-700">
                      {shortenAddress(tx.src)}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <Link to={`/user/${tx.dst}`} className="text-blue-500 hover:text-blue-700">
                      {shortenAddress(tx.dst)}
                    </Link>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {tx.lamport ? (tx.lamport / 1000000000).toFixed(9) : '0'}
                  </td>
                  <td className="py-2 px-4 border-b">{tx.blockTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-10 border rounded bg-gray-50">
          No transactions found for this address.
        </div>
      )}
    </div>
  );
}