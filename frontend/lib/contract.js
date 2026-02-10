import { createClient } from '@supabase/supabase-js';

// 1. Supabase Configuration
// Make sure to replace these with your actual URL and Key if they aren't already set
const supabaseUrl = 'https://wlhrvywdzdkigekupuvn.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsaHJ2eXdkemRraWdla3VwdXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTcwNTksImV4cCI6MjA4NjI3MzA1OX0.H9pnDFIYvZCUmRFfYzGd5H5U7ep9pw5SjkbLfLLWso4'; 
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Contract Address
export const CONTRACT_ADDRESS = "0xE1321c60812850A77d8a72858a8777C20076E5EB"; // Paste your deployed contract address here

// 3. TIER METADATA
export const TIER_METADATA = {
  0: { name: "No Tier", color: "#ffffff", threshold: 0 },
  1: { name: "Bronze", color: "#CD7F32", threshold: 100, metadataURI: "ipfs://QmBronzeURI" },
  2: { name: "Silver", color: "#C0C0C0", threshold: 500, metadataURI: "ipfs://QmSilverURI" },
  3: { name: "Gold", color: "#FFD700", threshold: 1000, metadataURI: "ipfs://QmGoldURI" }
};

// 4. JSON ABI (The Fix for the "in operator" error)
export const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "role", "type": "bytes32" },
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "hasRole",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "member", "type": "address" }],
    "name": "getMemberData",
    "outputs": [
      { "internalType": "uint256", "name": "xp", "type": "uint256" },
      { "internalType": "uint8", "name": "tier", "type": "uint8" },
      { "internalType": "bool", "name": "hasNFT", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "member", "type": "address" },
      { "internalType": "uint256", "name": "xpAmount", "type": "uint256" }
    ],
    "name": "updateXP",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "string", "name": "tokenURI", "type": "string" }],
    "name": "mintIdentityNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];