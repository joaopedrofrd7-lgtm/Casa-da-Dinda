import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Board, ProductionItem } from '../types';
import { Plus, Trash2, Package, Square, ClipboardCheck, Minus, Search } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function ProductionCalculator({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Production state
  const [finalProductName, setFinalProductName] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [selectedItems, setSelectedItems] = useState<ProductionItem[]>([]);
  const [toySearchTerm, setToySearchTerm] = useState('');

  useEffect(() => {
    const qProducts = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    const qBoards = query(collection(db, 'boards'), where('ownerId', '==', user.uid));
    const unsubscribeBoards = onSnapshot(qBoards, (snapshot) => {
      setBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Board)));
    });

    return () => {
      unsubscribeProducts();
      unsubscribeBoards();
    };
  }, [user.uid]);

  const addToy = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
      toast.error('Produto sem estoque!');
      return;
    }

    const existing = selectedItems.find(item => item.productId === productId);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Estoque insuficiente.');
        return;
      }
      setSelectedItems(selectedItems.map(item => 
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        productId,
        name: product.name,
        quantity: 1,
        unitCost: product.cost
      }]);
    }
  };

  const removeToy = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, qty: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (qty > product.stock) {
      toast.error(`Apenas ${product.stock} disponíveis.`);
      return;
    }
    if (qty <= 0) {
      removeToy(productId);
      return;
    }
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId ? { ...item, quantity: qty } : item
    ));
  };

  const selectedBoard = boards.find(b => b.id === selectedBoardId);
  const toysTotal = selectedItems.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  const totalCost = (selectedBoard?.cost || 0) + toysTotal;

  const handleFinishProduction = async () => {
    if (!finalProductName || !selectedBoardId || selectedItems.length === 0) {
      toast.error('Preencha as informações da produção.');
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      const productionData = {
        finalProductName,
        boardId: selectedBoardId,
        boardName: selectedBoard?.name || '',
        items: selectedItems,
        totalCost,
        ownerId: user.uid,
        createdAt: serverTimestamp()
      };
      
      const newProductionRef = doc(collection(db, 'productions'));
      batch.set(newProductionRef, productionData);

      for (const item of selectedItems) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, {
            stock: product.stock - item.quantity,
            updatedAt: serverTimestamp()
          });
        }
      }

      await batch.commit();
      toast.success('Produção registrada e estoque baixado!');
      
      setFinalProductName('');
      setSelectedBoardId('');
      setSelectedItems([]);
    } catch (err) {
      toast.error('Erro ao registrar produção');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 animate-pulse serif text-olive font-bold">Carregando calculadora de custos...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-olive serif">Calculadora de Custo</h2>
          <p className="text-gray-500">Combine tábua e brinquedos para calcular o custo total e baixar estoque.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8 bg-white">
            <h3 className="text-xl font-bold text-ink serif mb-6 flex items-center gap-2">
              <Square className="text-olive" size={24} /> 1. Escolha a Tábua
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {boards.map(board => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoardId(board.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all text-left group",
                    selectedBoardId === board.id 
                      ? "border-olive bg-sand ring-4 ring-olive/5" 
                      : "border-olive/5 bg-sand/30 hover:border-olive/20"
                  )}
                >
                  <p className="font-bold text-ink mb-1 group-hover:text-olive">{board.name}</p>
                  <p className="text-xs font-bold text-olive/60">{formatCurrency(board.cost)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-8 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-xl font-bold text-ink serif flex items-center gap-2">
                <Plus className="text-olive" size={24} /> 2. Adicione os Brinquedos
              </h3>
              <div className="relative group flex-1 md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-olive transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Buscar brinquedos..."
                  value={toySearchTerm}
                  onChange={(e) => setToySearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-sand/30 border border-olive/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products
                .filter(p => p.name.toLowerCase().includes(toySearchTerm.toLowerCase()))
                .map(p => (
                <button
                  key={p.id}
                  onClick={() => addToy(p.id)}
                  disabled={p.stock <= 0}
                  className={cn(
                    "rounded-2xl border transition-all text-left group relative flex flex-col overflow-hidden bg-white",
                    p.stock <= 0 
                      ? "opacity-50 grayscale cursor-not-allowed border-olive/10" 
                      : "border-olive/10 hover:border-olive/30 hover:bg-sand/30 shadow-sm"
                  )}
                >
                  <div className="h-24 bg-sand w-full overflow-hidden flex items-center justify-center">
                    {p.imageUrl ? (
                      <img 
                        src={p.imageUrl} 
                        alt={p.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="text-olive/10" size={32} />
                    )}
                  </div>
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <p className="font-bold text-ink text-xs mb-1 group-hover:text-olive line-clamp-1">{p.name}</p>
                      <p className="text-[10px] uppercase font-bold text-gray-400">Estoque: {p.stock}</p>
                    </div>
                    <p className="text-sm font-bold text-olive mt-1">{formatCurrency(p.cost)}</p>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-olive text-white p-1 rounded-full shadow-lg">
                    <Plus size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-8 sticky top-8 bg-white border-olive/20 shadow-xl shadow-olive/5">
            <h3 className="text-2xl font-bold text-olive serif mb-6">Resumo</h3>
            
            <div className="space-y-6 mb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nome da Peça Final</label>
                <input
                  type="text"
                  placeholder="Ex: Tábua de Baleia"
                  value={finalProductName}
                  onChange={e => setFinalProductName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                />
              </div>

              {selectedBoard && (
                <div className="flex justify-between items-center p-4 bg-sand rounded-2xl border border-olive/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Square size={16} className="text-olive" />
                    </div>
                    <span className="font-bold text-ink truncate max-w-[120px]">
                      {selectedBoard.name}
                    </span>
                  </div>
                  <span className="font-bold text-olive">{formatCurrency(selectedBoard.cost)}</span>
                </div>
              )}
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                  Brinquedos ({selectedItems.reduce((a, b) => a + b.quantity, 0)})
                </p>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-gray-400 italic border border-dashed border-olive/10 p-6 rounded-2xl text-center">Nenhum item adicionado</p>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map(item => (
                      <div key={item.productId} className="flex justify-between items-center gap-3 p-3 bg-white border border-olive/5 rounded-2xl shadow-sm group">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-ink truncate text-sm">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand rounded-lg text-xs hover:bg-olive hover:text-white transition-colors"
                            >-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-sand rounded-lg text-xs hover:bg-olive hover:text-white transition-colors"
                            >+</button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-olive text-sm">{formatCurrency(item.unitCost * item.quantity)}</p>
                          <button onClick={() => removeToy(item.productId)} className="text-red-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-olive/10 space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Custo Total</span>
                <span className="text-4xl font-bold text-olive tracking-tight leading-none">{formatCurrency(totalCost)}</span>
              </div>

              <button
                onClick={handleFinishProduction}
                disabled={!finalProductName || !selectedBoardId || selectedItems.length === 0 || isSaving}
                className="w-full btn-primary h-14 text-lg shadow-xl shadow-olive/20 flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <>Sincronizando...</>
                ) : (
                  <>
                    <ClipboardCheck size={24} />
                    Finalizar Produção
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
