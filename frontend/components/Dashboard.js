"use client";
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ABI, TIER_METADATA } from '../lib/contract';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [memberData, setMemberData] = useState({ xp: 0, tier: 0, hasNFT: false });
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const REAL_CONTRACT_ADDRESS = "0x1D13fcC1820f6B1BC725473F2ce9184333211000";

  const BADGE_IMAGES = {
    0: "https://gateway.pinata.cloud/ipfs/QmUNLLsP2mSNo_placeholder_hash", 
    1: "https://gateway.pinata.cloud/ipfs/QmaECULt529CMMKPQBEEaxYEqWPzh3VrxoE8Gk2oT3BF1q", 
    2: "https://gateway.pinata.cloud/ipfs/QmcyVWdRVY1fNEVWhun6UbXoJMa98y5F9hHaVC8cwVjHPk", 
    3: "https://gateway.pinata.cloud/ipfs/QmZu73HaG64u29PvXijKmwKKkCvufdFSB67vGtd2Uf9jCy"
  };

  useEffect(() => { setMounted(true); }, []);

  const { data, refetch } = useContractRead({
    address: REAL_CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMemberData',
    args: [address],
    enabled: isConnected && !!address,
    watch: true,
  });

  useEffect(() => {
    if (data) {
      const xpRaw = data.xp ? data.xp : data[0]; 
      const tierRaw = data.tier !== undefined ? data.tier : data[1];
      const nftRaw = data.hasNFT !== undefined ? data.hasNFT : data[2];

      const xp = xpRaw ? Number(xpRaw) : 0;
      let tier = tierRaw ? Number(tierRaw) : 0;

      if (tier === 0) {
        if (xp >= 1000) tier = 3;      
        else if (xp >= 500) tier = 2; 
        else if (xp >= 100) tier = 1;
      }

      setMemberData({ xp, tier, hasNFT: !!nftRaw });
    }
  }, [data]);

  const { write: mintNFT, data: mintData, isLoading: isWriteLoading } = useContractWrite({
    address: REAL_CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'mintIdentityNFT',
    onError(error) {
      toast.error("Mint Failed: " + error.message.slice(0, 50));
    }
  });

  const { isLoading: isWaitLoading } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess() { 
      toast.success('🎉 NFT Minted!'); 
      refetch(); 
    }
  });

  const isMinting = isWriteLoading || isWaitLoading;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (!mounted || !isConnected) return null;

  const tierInfo = TIER_METADATA[memberData.tier] || TIER_METADATA[0];

  return (
    <div className="space-y-6">
      <div className="p-8 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl">
        
        {}
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-4xl font-bold text-white">Identity Status</h2>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full transition-all"
          >
            {isRefreshing ? '⏳ Syncing...' : '🔄 Force Refresh'}
          </button>
        </div>
        
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-6 bg-black/40 rounded-xl border border-white/5 text-center">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-blue-400 mb-2">Total XP</p>
                <p className="text-5xl font-mono text-white font-bold">{memberData.xp}</p>
            </div>

            <div className="p-6 bg-black/40 rounded-xl border border-white/5 text-center">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider text-purple-400 mb-2">Current Rank</p>
                <p className="text-3xl font-bold" style={{ color: tierInfo.color }}>
                {tierInfo.name}
                </p>
            </div>
          </div>

          {}
          <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group min-h-[180px]">
            {}
            <div 
                className="absolute inset-0 opacity-20 blur-2xl transition-all duration-700" 
                style={{ backgroundColor: tierInfo.color }}
            ></div>
            
            {}
            <img 
                src={BADGE_IMAGES[memberData.tier] || BADGE_IMAGES[0]} 
                alt={tierInfo.name}
                className="w-32 h-32 object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110 z-10"
                onError={(e) => { 
                  e.target.style.display = 'none';
                }} 
            />
            
            <span className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-400 z-10">
                {memberData.tier === 0 ? "No Badge" : "Official Badge"}
            </span>
          </div>

        </div>

        {}
        <div className="mt-8 pt-6 border-t border-white/10">
              {!memberData.hasNFT ? (
               <button
                 onClick={() => mintNFT({ args: [tierInfo.metadataURI || ""] })}
                 disabled={memberData.tier === 0 || isMinting}
                 className={`w-full py-4 rounded-xl font-bold text-2xl transition-all shadow-lg ${
                   memberData.tier === 0
                     ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                     : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-purple-900/40 transform hover:-translate-y-1'
                 }`}
               >
                 {isMinting ? '⏳ Minting on Blockchain...' : 
                  memberData.tier > 0 ? `🎨 Mint ${tierInfo.name} Identity NFT` : 
                  '🔒 Earn 100 XP to Unlock Minting'}
               </button>
             ) : (
               <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-green-400 font-bold text-2xl">✅ Identity NFT Owned</p>
                  <p className="text-zinc-500 text-lg mt-1">You are verified on-chain.</p>
               </div>
             )}
        </div>
      </div>
    </div>
  );
}
