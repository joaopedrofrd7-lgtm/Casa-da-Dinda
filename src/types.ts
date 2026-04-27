import { Timestamp } from 'firebase/firestore';

export interface Product {
  id: string;
  name: string;
  cost: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface Board {
  id: string;
  name: string;
  cost: number;
  dimensions?: string;
  ownerId: string;
  createdAt: Timestamp;
}

export interface ProductionItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Production {
  id: string;
  finalProductName: string;
  boardId: string;
  boardName: string;
  items: ProductionItem[];
  totalCost: number;
  ownerId: string;
  createdAt: Timestamp;
}
