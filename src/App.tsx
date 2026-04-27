/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { LayoutDashboard, Boxes, Square, Calculator, History, LogOut, PackageOpen } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Boards from './components/Boards';
import ProductionCalculator from './components/Calculator';
import ProductionHistory from './components/History';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'products' | 'boards' | 'calculator' | 'history';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-pulse text-[#5A5A40] font-medium serif text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-[#E4E3E0] text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center text-white">
              <PackageOpen size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#141414] serif mb-2">Artesanato Manager</h1>
          <p className="text-[#8E9299] mb-8">Gestão de estoque e custos para suas criações artesanais.</p>
          <button
            onClick={signInWithGoogle}
            className="w-full bg-[#5A5A40] text-white py-4 px-6 rounded-full font-medium hover:bg-[#4A4A35] transition-colors flex items-center justify-center gap-2"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Brinquedos', icon: Boxes },
    { id: 'boards', label: 'Tábuas', icon: Square },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="min-h-screen bg-sand flex flex-col md:flex-row text-ink">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-olive/10 flex flex-col">
        <div className="p-6 border-b border-olive/10">
          <h1 className="text-xl font-bold text-olive serif flex items-center gap-2">
            <div className="w-8 h-8 bg-olive rounded-lg flex items-center justify-center text-white">
              <PackageOpen size={16} />
            </div>
            Oficina Sensorial
          </h1>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                activeTab === item.id 
                  ? "bg-olive text-white shadow-md shadow-olive/20" 
                  : "text-gray-500 hover:bg-sand hover:text-olive"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-olive/10">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-olive/10" />
            <div className="flex-1 truncate">
              <p className="font-semibold text-ink truncate">{user.displayName}</p>
              <p className="text-xs truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard user={user} />}
          {activeTab === 'products' && <Products user={user} />}
          {activeTab === 'boards' && <Boards user={user} />}
          {activeTab === 'calculator' && <ProductionCalculator user={user} />}
          {activeTab === 'history' && <ProductionHistory user={user} />}
        </div>
      </main>
    </div>
  );
}
