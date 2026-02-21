"use client";
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, TIER_METADATA } from '../lib/contract';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [memberData, setMemberData] = useState({ xp: 0, tier: 0, hasNFT: false });
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMintGuardLoading, setIsMintGuardLoading] = useState(false);

  const BADGE_IMAGES = {
    0: "https://gateway.pinata.cloud/ipfs/QmUNLLsP2mSNo_placeholder_hash",
    1: "https://gateway.pinata.cloud/ipfs/QmaECULt529CMMKPQBEEaxYEqWPzh3VrxoE8Gk2oT3BF1q",
    2: "https://gateway.pinata.cloud/ipfs/QmcyVWdRVY1fNEVWhun6UbXoJMa98y5F9hHaVC8cwVjHPk",
    3: "https://gateway.pinata.cloud/ipfs/QmZu73HaG64u29PvXijKmwKKkCvufdFSB67vGtd2Uf9jCy"
  };

  useEffect(() => { setMounted(true); }, []);

  const { data, refetch } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getMemberData',
    args: [address],
    enabled: isConnected && !!address,
    watch: true,
  });

  useEffect(() => {
    if (data) {
      const xpRaw  = data.xp  !== undefined ? data.xp  : data[0];
      const tierRaw = data.tier !== undefined ? data.tier : data[1];
      const nftRaw  = data.hasNFT !== undefined ? data.hasNFT : data[2];

      const xp = xpRaw ? Number(xpRaw) : 0;
      let tier = tierRaw ? Number(tierRaw) : 0;

      // Client-side tier fallback if contract returns 0
      if (tier === 0) {
        if (xp >= 1000) tier = 3;
        else if (xp >= 500) tier = 2;
        else if (xp >= 100) tier = 1;
      }

      setMemberData({ xp, tier, hasNFT: !!nftRaw });
    }
  }, [data]);

  // ── Helper: decode known custom errors ─────────────────────────────────────
  const decodeContractError = (error) => {
    const msg = error?.message || error?.shortMessage || "";

    // Map known custom error signatures to human-readable messages
    const knownErrors = {
      "AlreadyMinted":    "You have already minted your Identity NFT.",
      "NFTAlreadyMinted": "You have already minted your Identity NFT.",
      "NotEligible":      "You are not eligible to mint yet.",
      "TierNotMet":       "Your on-chain tier is too low to mint.",
      "InsufficientXP":   "You don't have enough XP on-chain to mint.",
      "NotRegistered":    "Your address is not registered in the contract.",
      "MintingNotAllowed":"Minting is currently not allowed.",
      "InvalidTier":      "Invalid tier — please contact the admin.",
    };

    for (const [name, readable] of Object.entries(knownErrors)) {
      if (msg.includes(name)) return readable;
    }

    // Raw signature fallback
    if (msg.includes("0x64a0ae92")) {
      return "Contract rejected the mint. You may already have an NFT, or your on-chain tier/XP doesn't meet the requirement. Try refreshing your data.";
    }

    return msg.slice(0, 100) || "Unknown contract error.";
  };

  // ── Contract write ──────────────────────────────────────────────────────────
  const {
    write: mintNFT,
    data: mintData,
    isLoading: isWriteLoading,
  } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'mintIdentityNFT',
    onError(error) {
      console.error("[mintNFT write error]", error);
      toast.dismiss();
      toast.error(decodeContractError(error));
      setIsMintGuardLoading(false);
    }
  });

  const { isLoading: isWaitLoading } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess() {
      toast.dismiss();
      toast.success('🎉 Identity NFT Minted Successfully!');
      refetch();
      setIsMintGuardLoading(false);
    },
    onError(error) {
      console.error("[mintNFT tx error]", error);
      toast.dismiss();
      toast.error(decodeContractError(error));
      setIsMintGuardLoading(false);
    }
  });

  const isMinting = isWriteLoading || isWaitLoading || isMintGuardLoading;

  // ── Mint handler: always do a fresh read before sending tx ─────────────────
  const handleMint = async () => {
    setIsMintGuardLoading(true);
    toast.loading("Verifying on-chain status...");

    try {
      const freshResult = await refetch();
      const freshData = freshResult?.data;

      if (freshData) {
        const freshHasNFT = freshData.hasNFT !== undefined ? freshData.hasNFT : freshData[2];
        const freshXP     = freshData.xp     !== undefined ? Number(freshData.xp)   : Number(freshData[0]);
        const freshTier   = freshData.tier    !== undefined ? Number(freshData.tier)  : Number(freshData[1]);

        // Re-evaluate tier client-side as fallback
        let effectiveTier = freshTier;
        if (effectiveTier === 0) {
          if (freshXP >= 1000) effectiveTier = 3;
          else if (freshXP >= 500) effectiveTier = 2;
          else if (freshXP >= 100) effectiveTier = 1;
        }

        console.log("[Mint Guard] hasNFT:", freshHasNFT, "| XP:", freshXP, "| tier:", effectiveTier);

        if (freshHasNFT) {
          toast.dismiss();
          toast.error("You already own an Identity NFT!");
          setMemberData(prev => ({ ...prev, hasNFT: true }));
          setIsMintGuardLoading(false);
          return;
        }

        if (effectiveTier === 0) {
          toast.dismiss();
          toast.error("You need at least 100 XP to mint.");
          setIsMintGuardLoading(false);
          return;
        }
      }

      toast.dismiss();
      toast.loading("Check your wallet to confirm...");

      const tierInfo = TIER_METADATA[memberData.tier] || TIER_METADATA[1];
      mintNFT({ args: [tierInfo.metadataURI || ""] });

    } catch (err) {
      console.error("[handleMint error]", err);
      toast.dismiss();
      toast.error("Failed to verify status. Try again.");
      setIsMintGuardLoading(false);
    }
  };

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

        {/* Header */}
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

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

          {/* XP + Rank */}
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

          {/* Badge image */}
          <div className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group min-h-[180px]">
            <div
              className="absolute inset-0 opacity-20 blur-2xl transition-all duration-700"
              style={{ backgroundColor: tierInfo.color }}
            />
            <img
              src={BADGE_IMAGES[memberData.tier] || BADGE_IMAGES[0]}
              alt={tierInfo.name}
              className="w-32 h-32 object-contain drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110 z-10"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-400 z-10">
              {memberData.tier === 0 ? "No Badge" : "Official Badge"}
            </span>
          </div>
        </div>

        {/* Mint / Owned section */}
        <div className="mt-8 pt-6 border-t border-white/10">
          {memberData.hasNFT ? (
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-400 font-bold text-2xl">✅ Identity NFT Owned</p>
              <p className="text-zinc-500 text-lg mt-1">You are verified on-chain.</p>
            </div>
          ) : (
            <>
              <button
                onClick={handleMint}
                disabled={memberData.tier === 0 || isMinting}
                className={`w-full py-4 rounded-xl font-bold text-2xl transition-all shadow-lg ${
                  memberData.tier === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                    : isMinting
                      ? 'bg-purple-800 text-white cursor-wait opacity-70'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-purple-900/40 transform hover:-translate-y-1'
                }`}
              >
                {isMinting
                  ? '⏳ Processing...'
                  : memberData.tier > 0
                    ? `🎨 Mint ${tierInfo.name} Identity NFT`
                    : '🔒 Earn 100 XP to Unlock Minting'}
              </button>

              {/* Debug info strip — remove after fixing */}
              <p className="text-center text-[10px] text-zinc-600 mt-2">
                on-chain xp: {memberData.xp} | tier: {memberData.tier} | hasNFT: {String(memberData.hasNFT)}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
