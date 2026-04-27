/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { auth, signInWithGoogle, logout } from './lib/firebase';
import { Boxes, Square, Calculator, History, LogOut, PackageOpen, ShoppingCart } from 'lucide-react';
import Products from './components/Products';
import Boards from './components/Boards';
import ProductionCalculator from './components/Calculator';
import InventoryPurchase from './components/Purchases';
import ProductionHistory from './components/History';
import { cn } from './lib/utils';

type Tab = 'products' | 'boards' | 'calculator' | 'history' | 'purchases';

import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('products');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-olive/20 border-t-olive rounded-full animate-spin" />
          <div className="text-olive font-medium serif text-xl tracking-tight">Oficina Sensorial</div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sand flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Visual/Mood */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden md:flex md:w-1/2 bg-olive items-center justify-center p-12 relative"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-64 h-64 border border-white rounded-full" />
            <div className="absolute bottom-20 right-10 w-96 h-96 border border-white rounded-full" />
          </div>
          
          <div className="max-w-md text-white z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <PackageOpen size={64} className="mb-8 opacity-50" />
              <h1 className="text-6xl font-bold serif leading-tight mb-6">Oficina<br />Sensorial</h1>
              <div className="h-1 w-20 bg-orange-200 mb-6" />
              <p className="text-xl text-white/80 font-light leading-relaxed">
                Gestão simplificada e elegante para o seu estoque de artesanato.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex items-center justify-center p-6 md:p-12 bg-sand"
        >
          <div className="max-w-sm w-full">
            <div className="md:hidden mb-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-olive rounded-2xl flex items-center justify-center text-white mb-4">
                <PackageOpen size={32} />
              </div>
              <h1 className="text-3xl font-bold text-ink serif">Oficina Sensorial</h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-ink serif mb-2">Bem-vindo de volta</h2>
                <p className="text-gray-500">Acesse sua oficina para gerenciar seus produtos e tábuas.</p>
              </div>

              <button
                onClick={signInWithGoogle}
                className="w-full group bg-white hover:bg-olive text-ink hover:text-white py-4 px-6 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-3 border border-olive/10 hover:border-transparent shadow-sm hover:shadow-xl hover:shadow-olive/20"
              >
                <div className="w-6 h-6 bg-sand group-hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                Continue com Google
              </button>

              <div className="pt-8 border-t border-olive/5 flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span>Gestão Versão 2.4</span>
                <span>© 2024</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'products', label: 'Brinquedos', icon: Boxes },
    { id: 'boards', label: 'Tábuas', icon: Square },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <div className="min-h-screen bg-sand flex flex-col md:flex-row text-ink">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-olive/10 flex flex-col">
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
          {activeTab === 'products' && <Products user={user} />}
          {activeTab === 'boards' && <Boards user={user} />}
          {activeTab === 'purchases' && <InventoryPurchase user={user} />}
          {activeTab === 'calculator' && <ProductionCalculator user={user} />}
          {activeTab === 'history' && <ProductionHistory user={user} />}
        </div>
      </main>
    </div>
  );
}
