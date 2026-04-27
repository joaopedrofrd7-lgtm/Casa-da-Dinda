import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Board } from '../types';
import { Boxes, Square, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function Dashboard({ user }: { user: User }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

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

  const totalProductValue = products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const stats = [
    { label: 'Total de Brinquedos', value: products.length, icon: Boxes, color: 'text-olive', bg: 'bg-sand' },
    { label: 'Total de Tábuas', value: boards.length, icon: Square, color: 'text-terracotta', bg: 'bg-orange-50' },
    { label: 'Valor em Estoque', value: formatCurrency(totalProductValue), icon: TrendingUp, color: 'text-olive', bg: 'bg-green-50' },
  ];

  if (loading) return <div className="animate-pulse flex items-center justify-center p-20 serif text-olive font-bold">Carregando dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-olive serif mb-2">Olá, {user.displayName?.split(' ')[0]}</h2>
        <p className="text-gray-500">Aqui está um resumo do seu estoque e produção.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={cn("p-4 rounded-2xl", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold mb-1 text-gray-500">
                {stat.label}
              </p>
              <p className="text-2xl font-bold tracking-tight text-ink">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-[24px] p-6 shadow-sm">
          <div className="flex items-center gap-3 text-red-800 mb-6 font-bold">
            <AlertTriangle size={24} className="text-red-500" />
            <h3 className="text-xl serif">Alertas de Estoque Baixo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockProducts.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-ink">{product.name}</p>
                  <p className="text-xs text-red-500 font-bold">Apenas {product.stock} unidades</p>
                </div>
                <div className="text-[10px] bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold uppercase">
                  Mín: {product.minStock}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
