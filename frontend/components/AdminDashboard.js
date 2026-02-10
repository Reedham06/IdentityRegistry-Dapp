"use client";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, supabase } from '../lib/contract';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { address } = useAccount();
  const [targetAddress, setTargetAddress] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [mounted, setMounted] = useState(false);
  const [dbQueue, setDbQueue] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  const MY_WALLET = "0xE1321c60812850A77d8a72858a8777C20076E5EB".toLowerCase();

  const fetchQueue = async () => {
    const { data, error } = await supabase.from('submissions').select('*').eq('status', 'pending');
    if (!error) setDbQueue(data);
  };

  useEffect(() => { 
    setMounted(true);
    fetchQueue();
    window.addEventListener('taskSubmitted', fetchQueue);
    return () => window.removeEventListener('taskSubmitted', fetchQueue);
  }, []);

  const { data: adminHash } = useContractRead({ address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'ADMIN_ROLE' });
  const { data: isAdminRole } = useContractRead({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'hasRole', args: [adminHash, address], enabled: !!adminHash && !!address
  });

  const canAccess = isAdminRole || (address?.toLowerCase() === MY_WALLET);

  const { write: updateXP, data: updateData } = useContractWrite({
    address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: 'updateXP',
  });

  const { isLoading: isUpdating } = useWaitForTransaction({
    hash: updateData?.hash,
    async onSuccess() {
      toast.success('✅ Blockchain Updated!');
      
      await supabase.from('submissions').update({ status: 'approved' }).eq('id', currentId);
      
      setTargetAddress('');
      setXpAmount('');
      setCurrentId(null);
      fetchQueue();
      
      window.dispatchEvent(new Event('xpUpdatedGlobal'));
    }
  });

  const handleAward = (e) => {
    e.preventDefault();
    if (!ethers.utils.isAddress(targetAddress)) return toast.error('Invalid Address');
    
    updateXP({ 
      args: [targetAddress, ethers.BigNumber.from(xpAmount)] 
    });
  };

  if (!mounted || !canAccess) return null;

  return (
    <div className="p-8 bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-bold text-purple-400 mb-6 flex justify-between items-center">
        Admin Panel
        <button onClick={fetchQueue} className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors">🔄 Refresh</button>
      </h2>
      
      <form onSubmit={handleAward} className="space-y-4 mb-10">
        <input className="w-full p-3 bg-black border border-white/10 rounded-lg text-white text-sm" placeholder="User Address (Auto-filled)" value={targetAddress} readOnly />
        <input className="w-full p-3 bg-black border border-white/10 rounded-lg text-white text-sm" placeholder="XP (Auto-filled)" value={xpAmount} readOnly />
        <button type="submit" disabled={isUpdating} className="w-full py-4 bg-purple-600 rounded-xl font-bold text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
          {isUpdating ? '⏳ Writing to Blockchain...' : 'Confirm Reward & Approve'}
        </button>
      </form>

      <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Pending Task Pile</h3>
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
        {dbQueue.length > 0 ? dbQueue.map((item) => (
          <div key={item.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center hover:bg-white/10 transition-colors group">
            <div className="overflow-hidden">
              <p className="text-[10px] font-mono text-purple-300 truncate">{item.address}</p>
              <p className="text-xs text-white font-bold">{item.task_title}</p>
              <p className="text-[10px] text-zinc-500 italic mt-1 truncate">"{item.proof_link}"</p>
            </div>
            <button 
              onClick={() => { setTargetAddress(item.address); setXpAmount(item.xp_reward.toString()); setCurrentId(item.id); }}
              className="ml-4 text-[10px] bg-purple-600 text-white px-3 py-2 rounded font-bold hover:scale-105 transition-transform"
            >
              PROCESS
            </button>
          </div>
        )) : (
          <p className="text-xs text-zinc-600 italic text-center py-4">No tasks in database.</p>
        )}
      </div>
    </div>
  );
}