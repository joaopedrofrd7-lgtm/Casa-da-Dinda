import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Board } from '../types';
import { Plus, Pencil, Trash2, X, Square, Search } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

export default function Boards({ user }: { user: User }) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    dimensions: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'boards'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBoards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Board)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'boards'));

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
        dimensions: formData.dimensions,
        ownerId: user.uid,
        updatedAt: serverTimestamp()
      };

      if (editingBoard) {
        await updateDoc(doc(db, 'boards', editingBoard.id), data);
        toast.success('Tábua atualizada!');
      } else {
        await addDoc(collection(db, 'boards'), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast.success('Tábua adicionada!');
      }
      handleClose();
    } catch (err) {
      toast.error('Erro ao salvar tábua');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (b: Board) => {
    setEditingBoard(b);
    setFormData({
      name: b.name,
      cost: b.cost.toString(),
      dimensions: b.dimensions || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'boards', id));
      toast.success('Tábua excluída');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `boards/${id}`);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingBoard(null);
    setFormData({ name: '', cost: '', dimensions: '' });
  };

  const filteredBoards = boards.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-olive serif">Tábuas (Bases)</h2>
          <p className="text-gray-500">Gerencie suas bases de madeira.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-olive/20"
        >
          <Plus size={20} /> Nova Tábua
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-olive transition-colors" size={20} />
        <input
          type="text"
          placeholder="Buscar tábuas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-olive/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-olive/20 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400 serif italic">Carregando tábuas...</div>
        ) : filteredBoards.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-[32px] border border-dashed border-olive/20">
            <Square className="mx-auto text-olive/20 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Nenhuma tábua encontrada.</p>
          </div>
        ) : (
          filteredBoards.map(board => (
            <div key={board.id} className="card p-6 flex flex-col justify-between h-full hover:scale-[1.02] transition-transform">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-sand rounded-2xl">
                    <Square className="text-olive" size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(board)} className="p-2 text-gray-400 hover:bg-sand hover:text-olive rounded-xl transition-all">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(board.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-ink serif mb-1">{board.name}</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">{board.dimensions || 'Sem dimensões'}</p>
              </div>
              <div className="pt-4 border-t border-sand">
                <p className="text-2xl font-bold text-olive tracking-tight text-right">{formatCurrency(board.cost)}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold text-right mt-1">Custo da base</p>
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
                {editingBoard ? 'Editar Tábua' : 'Nova Tábua'}
              </h3>
              <button onClick={handleClose} className="p-2 hover:bg-olive/10 rounded-full transition-colors text-olive">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nome da Tábua</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                  placeholder="Ex: Tábua de Pinus G"
                />
              </div>

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
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Medidas (opcional)</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={e => setFormData({...formData, dimensions: e.target.value})}
                  className="w-full px-5 py-3.5 bg-sand/50 border border-olive/5 rounded-2xl focus:ring-2 focus:ring-olive/20 focus:bg-white outline-none transition-all"
                  placeholder="Ex: 30x40cm"
                />
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
