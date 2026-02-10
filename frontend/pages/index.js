import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import Dashboard from '../components/Dashboard';
import TasksSection from '../components/TasksSection';
import ValidationDashboard from '../components/ValidationDashboard';

export default function Home() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      
      {}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent cursor-default">
            IdentityRegistry
          </h1>
          <ConnectButton showBalance={false} />
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {}

        {}
        {!mounted ? (
           <div className="text-center py-20 opacity-0">Loading...</div>
        ) : !isConnected ? (

          <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-purple-500/20">
              <span className="text-4xl">🆔</span>
            </div>
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Welcome to the Registry
            </h2>
            <p className="text-zinc-400 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
              Connect your wallet to manage your decentralized identity, complete community tasks, and earn on-chain reputation.
            </p>
            <div className="flex justify-center transform scale-125">
              <ConnectButton />
            </div>
          </div>

        ) : (

          <div className="space-y-12 animate-in fade-in duration-500">
            {}
            <Dashboard />
            
            {}
            <div className="border-t border-white/10 pt-10">
              <TasksSection />
            </div>

            {}
            <div className="pt-10 border-t border-white/10">
              <ValidationDashboard />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}