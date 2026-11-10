import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePortfolio } from '../contexts/PortfolioContext';
import { today } from '../utils/id';
import type { Product } from '../types/portfolio';

export function useProduct() {
  const { id } = useParams();
  const { products, setProducts } = usePortfolio();
  const product = products.find((p) => p.id === id);

  const update = useCallback(
    (fn: (p: Product) => Product) =>
    setProducts((prev) => prev.map((p) => p.id === id ? { ...fn(p), updatedAt: today() } : p)),
    [id, setProducts]
  );

  const patch = useCallback((changes: Partial<Product>) => update((p) => ({ ...p, ...changes })), [update]);

  return { product, update, patch };
}