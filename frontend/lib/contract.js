import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export const CONTRACT_ADDRESS = "0x60AaeBEB440EC99eB52f1341b8521C9F7a393209";

export const TIER_METADATA = {
  0: { name: "No Tier", color: "#ffffff", threshold: 0, metadataURI: "" },
  1: { name: "Bronze", color: "#CD7F32", threshold: 100, metadataURI: "ipfs://QmBronzeURI" },
  2: { name: "Silver", color: "#C0C0C0", threshold: 500, metadataURI: "ipfs://QmSilverURI" },
  3: { name: "Gold", color: "#FFD700", threshold: 1000, metadataURI: "ipfs://QmGoldURI" }
};

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
  },

  { "inputs": [], "name": "AlreadyMinted",         "type": "error" },
  { "inputs": [], "name": "NFTAlreadyMinted",       "type": "error" },
  { "inputs": [], "name": "NotEligible",            "type": "error" },
  { "inputs": [], "name": "TierNotMet",             "type": "error" },
  { "inputs": [], "name": "InsufficientXP",         "type": "error" },
  { "inputs": [], "name": "NotRegistered",          "type": "error" },
  { "inputs": [], "name": "MintingNotAllowed",      "type": "error" },
  { "inputs": [], "name": "InvalidTier",            "type": "error" },

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "member",    "type": "address" },
      { "indexed": false, "internalType": "uint256",  "name": "xpAmount",  "type": "uint256" }
    ],
    "name": "XPUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true,  "internalType": "address", "name": "member",   "type": "address" },
      { "indexed": false, "internalType": "uint256",  "name": "tokenId",  "type": "uint256" }
    ],
    "name": "NFTMinted",
    "type": "event"
  },
  { "inputs": [], "name": "Ineligible", "type": "error" },
{ "inputs": [], "name": "AlreadyMinted", "type": "error" },
{ "inputs": [], "name": "Unauthorized", "type": "error" },
];
