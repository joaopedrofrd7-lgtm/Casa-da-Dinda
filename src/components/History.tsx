import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Production } from '../types';
import { History as HistoryIcon, Trash2, Calendar, FileDown, Square } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function ProductionHistory({ user }: { user: User }) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'productions'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProductions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Production)));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'productions'));

    return unsubscribe;
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'productions', id));
      toast.success('Registro excluído');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `productions/${id}`);
    }
  };

  const exportData = () => {
    const headers = ['Data', 'Nome do Produto', 'Tábua', 'Custo Total', 'Itens'];
    const rows = productions.map(p => [
      format(p.createdAt.toDate(), 'dd/MM/yyyy HH:mm'),
      p.finalProductName,
      p.boardName,
      p.totalCost.toString().replace('.', ','),
      p.items.map(i => `${i.quantity}x ${i.name}`).join(' | ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(';') + "\n"
      + rows.map(e => e.join(';')).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_producao.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center py-20 animate-pulse serif text-olive font-bold">Carregando histórico...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold text-olive serif">Histórico de Produção</h2>
          <p className="text-gray-500">Acompanhe suas peças produzidas e custos acumulados.</p>
        </div>
        {productions.length > 0 && (
          <button
            onClick={exportData}
            className="btn-secondary flex items-center gap-2 shadow-sm"
          >
            <FileDown size={20} /> Exportar CSV
          </button>
        )}
      </div>

      <div className="space-y-6">
        {productions.length === 0 ? (
          <div className="text-center py-32 card border-dashed">
            <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center mx-auto mb-6">
              <HistoryIcon className="text-olive/20" size={40} />
            </div>
            <p className="text-gray-500 font-bold serif text-xl italic text-olive/40">Nenhuma produção registrada até agora.</p>
          </div>
        ) : (
          productions.map(production => (
            <div key={production.id} className="card p-8 group hover:border-olive/30 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-olive/40 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">
                      <Calendar size={14} />
                      {production.createdAt 
                        ? format(production.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: ptBR })
                        : 'Sincronizando...'}
                    </div>
                    <h3 className="text-3xl font-bold text-ink serif">{production.finalProductName}</h3>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-sand px-4 py-1.5 rounded-full text-xs font-bold text-olive border border-olive/5">
                      <Square size={12} />
                      Tábua: {production.boardName}
                    </div>
                    {production.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white border border-olive/10 px-4 py-1.5 rounded-full text-xs font-bold text-gray-500 shadow-sm">
                        <span className="text-olive">{item.quantity}x</span> {item.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-sand pt-6 md:pt-0 md:pl-10">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">Custo Total</p>
                    <p className="text-4xl font-bold text-olive tracking-tight leading-none">{formatCurrency(production.totalCost)}</p>
                  </div>
                  <div className="flex gap-2 md:mt-6">
                    <button 
                      onClick={() => handleDelete(production.id)}
                      className="p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
