"use client";
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '../lib/contract';
import { TASKS } from '../lib/tasks';
import toast from 'react-hot-toast';

import { 
  ChatBubbleLeftRightIcon, 
  HashtagIcon, 
  FingerPrintIcon, 
  StarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/solid';

export default function TasksSection() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofText, setProofText] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [dbSubmissions, setDbSubmissions] = useState([]);

  const ONE_TIME_TASKS = [
    "Follow on Twitter",
    "Join Discord",
    "Refer 3 Friends",
    "Complete Learning Module"
  ];

  const getIconComponent = (iconName) => {
    const style = "w-6 h-6"; 
    switch (iconName) {
      case 'discord': return <ChatBubbleLeftRightIcon className={style} />;
      case 'twitter': return <HashtagIcon className={style} />;
      case 'identity': return <FingerPrintIcon className={style} />;
      default: return <StarIcon className={style} />;
    }
  };

  useEffect(() => { setMounted(true); }, []);

  const fetchDbStatus = async () => {
    if (!address) return;
    const { data } = await supabase.from('submissions').select('*').eq('address', address);
    if (data) setDbSubmissions(data);
  };

  useEffect(() => {
    if (isConnected) fetchDbStatus();

    const channel = supabase.channel('user-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions', filter: `address=eq.${address}` },
        () => { fetchDbStatus(); }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isConnected, address]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofText.trim()) return toast.error('Please provide proof');

    const { error } = await supabase.from('submissions').insert([
      { 
        address: address, 
        task_title: selectedTask.title, 
        proof_link: proofText, 
        xp_reward: selectedTask.xpReward, 
        status: 'pending' 
      }
    ]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('✅ Submitted!');

      setDbSubmissions((prev) => [
        ...prev, 
        { task_title: selectedTask.title, status: 'pending' }
      ]);

      setProofText('');
      setShowSubmitModal(false);
      fetchDbStatus(); 
    }
  };

  const getStatus = (taskTitle) => {
    const sub = dbSubmissions.find(s => s.task_title === taskTitle);
    return sub ? sub.status : null; 
  };

  if (!mounted || !isConnected) return null;

  return (
    <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl shadow-xl mt-8">
      
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/20 rounded-lg">
           <ClipboardDocumentCheckIcon className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-4xl font-bold text-purple-400">Community Tasks</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TASKS.map((task) => {
          const isOneTime = ONE_TIME_TASKS.includes(task.title);
          
          const status = getStatus(task.title);
          
          const isPending = status === 'pending';
          const isCompleted = status === 'approved';

          return (
            <div key={task.id} className={`bg-zinc-900 border border-purple-500/30 p-8 rounded-2xl shadow-2xl transition-all ${
              isCompleted ? 'border-green-500/50 bg-green-900/10' : 'hover:border-blue-400 hover:-translate-y-1'
            }`}>
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {getIconComponent(task.iconType)}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{task.title}</h3>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${isCompleted ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  +{task.xpReward} XP
                </span>
              </div>
              
              <p className="text-gray-400 mb-6 text-sm pl-[3.25rem]">{task.description}</p>
              
              <div className="pl-[3.25rem]">
                <button
                  onClick={() => { setSelectedTask(task); setProofText(''); setShowSubmitModal(true); }}
                  
                  disabled={isOneTime && (isPending || isCompleted)}
                  
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                    // STYLE LOGIC
                    isCompleted && isOneTime
                      ? 'bg-zinc-700 text-zinc-400 cursor-default' 
                      : isPending && isOneTime
                        ? 'bg-yellow-600/50 text-yellow-200 cursor-default' 
                        : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20'
                  }`}
                >
                  {}
                  {isCompleted && isOneTime ? '✅ Completed' 
                    : isPending && isOneTime ? '⏳ Pending Review' 
                    : '📤 Submit Proof'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowSubmitModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">✕</button>
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              {getIconComponent(selectedTask.iconType)} 
              {selectedTask.title}
            </h3>
            <p className="text-zinc-400 text-sm mb-6">Paste a link or proof for this task.</p>
            <form onSubmit={handleSubmit}>
              <input 
                type="text" 
                autoFocus 
                value={proofText} 
                onChange={(e) => setProofText(e.target.value)} 
                placeholder="Proof Link / Screenshot URL" 
                className="w-full p-4 bg-black/50 border border-white/10 rounded-xl mb-6 text-white outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600" 
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="flex-1 py-3 border border-white/10 rounded-xl font-bold text-zinc-400 hover:bg-white/5">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 shadow-lg">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}