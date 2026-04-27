import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { ShoppingCart, Plus, Minus, Search, Package, Save } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function InventoryPurchase({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // State for pending updates: { productId: additionalQuantity }
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const updatePending = (productId: string, delta: number) => {
    const current = pendingUpdates[productId] || 0;
    const next = current + delta;
    
    if (next <= 0) {
      const newUpdates = { ...pendingUpdates };
      delete newUpdates[productId];
      setPendingUpdates(newUpdates);
    } else {
      setPendingUpdates({ ...pendingUpdates, [productId]: next });
    }
  };

  const setManualQuantity = (productId: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      const newUpdates = { ...pendingUpdates };
      delete newUpdates[productId];
      setPendingUpdates(newUpdates);
    } else {
      setPendingUpdates({ ...pendingUpdates, [productId]: num });
    }
  };

  const handleSaveInventory = async () => {
    if (Object.keys(pendingUpdates).length === 0) {
      toast.error('Nenhum item para atualizar.');
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      
      for (const [productId, additionalQty] of Object.entries(pendingUpdates)) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const productRef = doc(db, 'products', productId);
          batch.update(productRef, {
            stock: product.stock + additionalQty,
            updatedAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      toast.success('Estoque atualizado com sucesso!');
      setPendingUpdates({});
    } catch (err) {
      toast.error('Erro ao atualizar estoque');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItemsToUpdate = Object.values(pendingUpdates).reduce((acc: number, curr: number) => acc + curr, 0);

  if (loading) return <div className="text-center py-20 animate-pulse serif text-olive font-bold">Carregando estoque...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-olive serif">Reposição de Estoque</h2>
          <p className="text-gray-500">Adicione compras e atualize o estoque de Brinquedos.</p>
        </div>
        {Object.keys(pendingUpdates).length > 0 && (
          <button
            onClick={handleSaveInventory}
            disabled={isSaving}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-olive/20 animate-in slide-in-from-right-4"
          >
            <Save size={20} />
            {isSaving ? 'Salvando...' : `Salvar Estoque (+${totalItemsToUpdate} itens)`}
          </button>
        )}
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-olive transition-colors" size={20} />
        <input
          type="text"
          placeholder="Pesquisar produto para repor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-olive/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-dashed border-olive/20">
            <Package className="mx-auto text-olive/20 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Nenhum brinquedo encontrado.</p>
          </div>
        ) : (
          filteredProducts.map(product => {
            const pendingQty = pendingUpdates[product.id] || 0;
            return (
              <div key={product.id} className={cn(
                "card overflow-hidden group transition-all",
                pendingQty > 0 ? " ring-2 ring-olive border-transparent" : ""
              )}>
                <div className="h-40 bg-sand relative overflow-hidden">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-olive/10">
                      <Package size={48} />
                    </div>
                  )}
                  {pendingQty > 0 && (
                    <div className="absolute inset-0 bg-olive/20 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white text-3xl font-black serif drop-shadow-md">+{pendingQty}</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-ink serif truncate">{product.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">Estoque atual: {product.stock}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updatePending(product.id, -1)}
                      className="w-10 h-10 flex items-center justify-center bg-sand rounded-xl text-olive hover:bg-olive hover:text-white transition-all shadow-sm disabled:opacity-30"
                      disabled={pendingQty === 0}
                    >
                      <Minus size={18} />
                    </button>
                    <input 
                      type="number"
                      min="0"
                      value={pendingQty || ''}
                      onChange={(e) => setManualQuantity(product.id, e.target.value)}
                      placeholder="0"
                      className="flex-1 w-full text-center font-bold bg-sand/50 border border-olive/5 py-2 rounded-xl focus:bg-white focus:ring-2 focus:ring-olive/10 outline-none"
                    />
                    <button 
                      onClick={() => updatePending(product.id, 1)}
                      className="w-10 h-10 flex items-center justify-center bg-sand rounded-xl text-olive hover:bg-olive hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
