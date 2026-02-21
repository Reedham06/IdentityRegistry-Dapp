"use client";
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, supabase } from '../lib/contract';
import { ethers } from 'ethers';
import { ScaleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ValidationDashboard() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [dbQueue, setDbQueue] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const ADMIN_WALLET = (process.env.NEXT_PUBLIC_ADMIN_WALLET || "").toLowerCase();

  useEffect(() => { setMounted(true); }, []);

  const fetchQueue = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'pending');
    if (error) console.error("Supabase Error:", error);
    if (data) setDbQueue(data);
  };

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, fetchQueue)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const { data: adminRoleHash } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'ADMIN_ROLE',
  });

  const { data: isAdmin } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasRole',
    args: [adminRoleHash, address],
    enabled: !!adminRoleHash && !!address,
  });

  const { write: updateXP, data: updateData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'updateXP',
    onError(error) {
      console.error("updateXP write error:", error);
      toast.dismiss();
      toast.error(`Transaction Failed: ${error?.shortMessage || error.message?.slice(0, 60)}`);
      setProcessingId(null);
    }
  });

  const { isLoading: isUpdating } = useWaitForTransaction({
  hash: updateData?.hash,
  timeout: 120_000,
  async onSuccess() {
    toast.dismiss();
    toast.success("✅ Blockchain confirmed! Updating database...");
    if (processingId) {
      await supabase
        .from('submissions')
        .update({ status: 'approved' })
        .eq('id', processingId);
      setProcessingId(null);
      fetchQueue();
    }
  },
  onError(error) {
    toast.dismiss();
    toast("⚠️ Timeout — check Force Refresh to verify XP was awarded", { icon: "⚠️" });
    setProcessingId(null);
    fetchQueue();
  }
});

  const processReward = (submissionId, userAddress, xpAmount) => {
    if (!userAddress || !ethers.utils.isAddress(userAddress)) {
      return toast.error("Invalid wallet address in submission.");
    }
    setProcessingId(submissionId);
    toast.loading("Check your wallet to confirm...");
    try {
      updateXP({ args: [userAddress, ethers.BigNumber.from(xpAmount)] });
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to send transaction.");
      setProcessingId(null);
    }
  };

  const rejectTask = async (submissionId) => {
    const { error } = await supabase
      .from('submissions')
      .update({ status: 'rejected' })
      .eq('id', submissionId);
    if (error) toast.error("DB Error: " + error.message);
    else toast.success('Task Rejected');
    fetchQueue();
  };

  const shortenAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!mounted || !isConnected) return null;

  const canAccess = isAdmin || (address?.toLowerCase() === ADMIN_WALLET);

  if (!canAccess) {
    return (
      <div className="p-10 text-center font-bold text-red-600 bg-red-100 rounded-xl">
        🚫 Access Denied.<br />
        Your Address: {shortenAddress(address)}<br />
        Does not match the Admin Address.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-purple-500/30 p-8 rounded-2xl shadow-2xl mt-8">
      <div className="flex justify-between items-center mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <ScaleIcon className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-4xl font-bold text-purple-400">Validation Queue</h2>
        <button
          onClick={fetchQueue}
          className="text-xs bg-white/10 px-3 py-1 rounded text-white hover:bg-white/20"
        >
          Refresh List
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {dbQueue.length > 0 ? dbQueue.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg">{item.task_title}</h3>
              <p className="text-xs text-zinc-400 font-mono mb-2">
                User: {shortenAddress(item.address)}
                <span className="ml-2 text-yellow-400 font-bold">+{item.xp_reward} XP</span>
              </p>
              <div className="bg-black/50 p-3 rounded text-sm text-green-400 font-mono border border-white/10 break-all">
                {item.proof_link}
              </div>
            </div>

            <div className="flex gap-2 min-w-[200px]">
              <button
                onClick={() => processReward(item.id, item.address, item.xp_reward)}
                disabled={processingId !== null}
                className={`flex-1 py-2 px-4 rounded-lg font-bold text-white transition-all ${
                  processingId === item.id
                    ? 'bg-yellow-600 cursor-wait animate-pulse'
                    : processingId !== null
                      ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                {processingId === item.id ? 'Approving...' : 'Approve'}
              </button>

              <button
                onClick={() => rejectTask(item.id)}
                disabled={processingId !== null}
                className="bg-red-500/20 text-red-500 py-2 px-4 rounded-lg font-bold hover:bg-red-500/40 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-zinc-500 italic">All caught up! No pending tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
