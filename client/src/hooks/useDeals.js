import { useState, useEffect, useCallback } from 'react';
import { dealsApi } from '../lib/api.js';

export function useDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dealsApi.list();
      setDeals(data.deals || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const createDeal = async (address, propertyType) => {
    const data = await dealsApi.create({ address, propertyType });
    setDeals(prev => [data.deal, ...prev]);
    return data.deal;
  };

  const deleteDeal = async (id) => {
    await dealsApi.delete(id);
    setDeals(prev => prev.filter(d => d.id !== id));
  };

  const updateDeal = async (id, data) => {
    const result = await dealsApi.update(id, data);
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...result.deal } : d));
    return result.deal;
  };

  return { deals, loading, error, refetch: fetchDeals, createDeal, deleteDeal, updateDeal };
}

export function useDeal(id) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    dealsApi.get(id)
      .then(data => { setDeal(data.deal); setError(null); })
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { deal, loading, error };
}
