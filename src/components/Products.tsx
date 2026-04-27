import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { Plus, Pencil, Trash2, X, Package, Search } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Products({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    stock: '',
    minStock: '5',
    imageUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'products'));

    return unsubscribe;
  }, [user.uid]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        cost: Number(formData.cost),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        imageUrl: formData.imageUrl,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Produto atualizado!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast.success('Produto adicionado!');
      }
      handleClose();
    } catch (err) {
      toast.error('Erro ao salvar produto');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      cost: p.cost.toString(),
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      imageUrl: p.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Produto excluído');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({ name: '', cost: '', stock: '', minStock: '5', imageUrl: '' });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-olive serif">Brinquedos</h2>
          <p className="text-gray-500">Gerencie seu estoque de componentes.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-olive/20"
        >
          <Plus size={20} /> Novo Brinquedo
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-olive transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar brinquedos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-olive/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400 serif italic">Carregando produtos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-dashed border-olive/20">
            <Package className="mx-auto text-olive/20 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Nenhum brinquedo encontrado.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="card overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="h-48 bg-sand relative overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-olive/10">
                    <Package size={64} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-sm font-bold text-olive border border-white/50 shadow-sm">
                  {formatCurrency(product.cost)}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink serif">{product.name}</h3>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-wider mt-1",
                      product.stock <= product.minStock ? "text-red-500" : "text-gray-400"
                    )}>
                      {product.stock} unidades
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(product)} className="p-2 text-gray-400 hover:bg-sand hover:text-olive rounded-xl transition-all">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-olive/10 flex justify-between items-center bg-sand/30">
              <h3 className="text-2xl font-bold text-olive serif">
                {editingProduct ? 'Editar Brinquedo' : 'Novo Brinquedo'}
              </h3>
              <button onClick={handleClose} className="p-2 hover:bg-olive/10 rounded-full transition-colors text-olive">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nome do Produto</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                  placeholder="Ex: Arandela decorativa"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Valor de Custo (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Estoque Inicial</label>
                  <input
                    required
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Estoque Mínimo</label>
                  <input
                    required
                    type="number"
                    value={formData.minStock}
                    onChange={e => setFormData({...formData, minStock: e.target.value})}
                    className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">URL da Foto</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary flex-1 shadow-lg shadow-olive/20"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
