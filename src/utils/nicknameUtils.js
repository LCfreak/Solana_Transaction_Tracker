// export function getNickname(address) {
//   return localStorage.getItem(`nickname-${address}`);
// }

// export function setNickname(address, nickname) {
//   localStorage.setItem(`nickname-${address}`, nickname);
// }

const KNOWN_ADDRESSES = {
  // Solana programs
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'SysvarRent111111111111111111111111111111111': 'Rent Sysvar',
  'SysvarC1ock11111111111111111111111111111111': 'Clock Sysvar',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
  'Stake11111111111111111111111111111111111111': 'Stake Program',
  'Vote111111111111111111111111111111111111111': 'Vote Program',
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr': 'Memo Program',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s': 'Metaplex Metadata',
  
  // Major exchanges and services
  'FTT8cGNp3rfTC6cXhVbVNSuLkXTLvknVMTARpopzDVs8': 'FTX Hot Wallet',
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': 'Binance Hot Wallet',
  'E4DUKf7BX7q5pDdjA9HJ46PmxK4frMbxWLTh7PVK5HGA': 'Binance Cold Wallet',
  'hoakwpFB8UoLnPpLC56gsjpY7XbVwaCuRQRMQzN5TVh': 'Solana Foundation',
  
  // Major protocols
  'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'Magic Eden',
  'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K': 'Magic Eden v2',
  'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo': 'Solend',
  'JUP6i4ozu5ydDCnLiMogSckDPpbtr7BJ4FtzYWkb5Rk': 'Jupiter Aggregator',
};

// Local storage key for user-defined nicknames
const NICKNAME_STORAGE_KEY = 'solana_visualizer_nicknames';

// Load user-defined nicknames from local storage
function loadUserNicknames() {
  try {
    const savedNicknames = localStorage.getItem(NICKNAME_STORAGE_KEY);
    return savedNicknames ? JSON.parse(savedNicknames) : {};
  } catch (error) {
    console.error('Error loading nicknames from local storage:', error);
    return {};
  }
}

// Get all nicknames (hardcoded + user-defined)
export function getAllNicknames() {
  const userNicknames = loadUserNicknames();
  return { ...KNOWN_ADDRESSES, ...userNicknames };
}

// Get nickname for a specific address
export function getNickname(address) {
  if (!address) return null;
  
  const nicknames = getAllNicknames();
  return nicknames[address] || null;
}

// Save a new nickname
export function saveNickname(address, nickname) {
  if (!address || !nickname) return false;
  
  try {
    const userNicknames = loadUserNicknames();
    userNicknames[address] = nickname;
    localStorage.setItem(NICKNAME_STORAGE_KEY, JSON.stringify(userNicknames));
    return true;
  } catch (error) {
    console.error('Error saving nickname to local storage:', error);
    return false;
  }
}

// Remove a nickname
export function removeNickname(address) {
  if (!address) return false;
  
  try {
    const userNicknames = loadUserNicknames();
    
    if (userNicknames[address]) {
      delete userNicknames[address];
      localStorage.setItem(NICKNAME_STORAGE_KEY, JSON.stringify(userNicknames));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing nickname from local storage:', error);
    return false;
  }
}

// Check if address is a known program
export function isKnownProgram(address) {
  return !!KNOWN_ADDRESSES[address];
}