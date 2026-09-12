'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Transfer, Location, Item } from '../../types';
import { Plus, Send, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TransfersPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfersData = async () => {
    try {
      const [trf, inv] = await Promise.all([
        apiRequest('/transfers'),
        apiRequest('/inventory')
      ]);

      setTransfers(trf);

      const locMap = new Map();
      const itemMap = new Map();
      inv.forEach((i: any) => {
        locMap.set(i.location.id, i.location);
        itemMap.set(i.item.id, i.item);
      });
      const locList: Location[] = Array.from(locMap.values());
      setLocations(locList);
      setItems(Array.from(itemMap.values()));

      if (locList.length >= 2) {
        if (!sourceLocationId) setSourceLocationId(locList[0].id);
        if (!destinationLocationId) setDestinationLocationId(locList[1].id);
      }
      if (itemMap.size > 0 && !itemId) setItemId(Array.from(itemMap.keys())[0]);
    } catch (err) {
      console.error('Failed loading transfers data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfersData();
  }, []);

  useEffect(() => {
    const unsubCreate = subscribe('TRANSFER_CREATED', fetchTransfersData);
    const unsubDisp = subscribe('TRANSFER_DISPATCHED', fetchTransfersData);
    const unsubRec = subscribe('TRANSFER_RECEIVED', fetchTransfersData);
    const unsubInv = subscribe('INVENTORY_UPDATED', fetchTransfersData);

    return () => {
      unsubCreate();
      unsubDisp();
      unsubRec();
      unsubInv();
    };
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiRequest('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceLocationId,
          destinationLocationId,
          itemId,
          quantity: Number(quantity)
        })
      });
      setIsModalOpen(false);
      fetchTransfersData();
    } catch (err: any) {
      setError(err.message || 'Failed creating transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      await apiRequest(`/transfers/${id}/dispatch`, { method: 'POST' });
      fetchTransfersData();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await apiRequest(`/transfers/${id}/receive`, { method: 'POST' });
      fetchTransfersData();
    } catch (err: any) {
      alert(err.message || 'Receipt failed');
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'OPERATIONS_USER';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Internal Stock Transfers</h1>
              <p className="text-sm text-slate-500">Transfer inventory between warehouses with two-stage dispatch & receipt controls.</p>
            </div>
            {canManage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-purple-600/30 transition-all flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Request Stock Transfer</span>
              </button>
            )}
          </div>

          {/* Transfers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transfer #</th>
                    <th className="px-6 py-4">Source Location</th>
                    <th className="px-6 py-4">Destination Location</th>
                    <th className="px-6 py-4">Item & SKU</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading transfers...</td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No stock transfer requests recorded.</td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-purple-600">{trf.transferNumber}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{trf.sourceLocation.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800 flex items-center space-x-1">
                          <ArrowRight className="w-4 h-4 text-slate-400 mr-1" />
                          <span>{trf.destinationLocation.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{trf.item.name}</div>
                          <div className="text-xs text-slate-400 font-mono">{trf.item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">{trf.quantity} {trf.item.unit}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={trf.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {trf.status === 'REQUESTED' && canManage && (
                            <button
                              onClick={() => handleDispatch(trf.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors inline-flex items-center space-x-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {trf.status === 'DISPATCHED' && canManage && (
                            <button
                              onClick={() => handleReceive(trf.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
                          )}

                          {trf.status === 'RECEIVED' && (
                            <span className="text-xs font-medium text-slate-400 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Transfer Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Internal Stock Transfer Request">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Source Location (From)</label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Destination Location (To)</label>
                <select
                  value={destinationLocationId}
                  onChange={(e) => setDestinationLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item to Transfer</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
