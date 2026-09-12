'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { FuturisticCard } from '../../components/FuturisticCard';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Transfer, Location, Item } from '../../types';
import { Plus, Send, CheckCircle2, ArrowRight, RefreshCw, Repeat } from 'lucide-react';

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
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans relative">
      <Navbar />
      <div className="flex flex-1 relative z-10">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Repeat className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-wide font-display flex items-center gap-2">
                    STOCK TRANSFERS
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      LOGISTICS PROTOCOL
                    </span>
                  </h1>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Multi-node inventory transfer and dispatch management
                  </p>
                </div>
              </div>
            </div>

            {canManage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-900/30 transition-all flex items-center space-x-2 text-sm border border-purple-400/30"
              >
                <Plus className="w-4 h-4" />
                <span>Request Stock Transfer</span>
              </button>
            )}
          </div>

          {/* Transfers Table Card */}
          <FuturisticCard className="p-0 overflow-hidden border-slate-800/80">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Transfer Requests Log ({transfers.length})
                </h3>
              </div>
              <button
                onClick={fetchTransfersData}
                className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>SYNC LOGS</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/70 border-b border-slate-800/80 text-xs font-mono text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transfer #</th>
                    <th className="px-6 py-4">Source Node</th>
                    <th className="px-6 py-4">Destination Node</th>
                    <th className="px-6 py-4">Item & SKU</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-mono">
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                          <span>Loading logistics stream...</span>
                        </div>
                      </td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-mono">
                        No stock transfer requests recorded.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-cyan-400">{trf.transferNumber}</td>
                        <td className="px-6 py-4 font-semibold text-slate-200">{trf.sourceLocation.name}</td>
                        <td className="px-6 py-4 font-semibold text-slate-200">
                          <span className="flex items-center space-x-1.5">
                            <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{trf.destinationLocation.name}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{trf.item.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{trf.item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-cyan-300 font-mono">
                          {trf.quantity} {trf.item.unit}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={trf.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {trf.status === 'REQUESTED' && canManage && (
                            <button
                              onClick={() => handleDispatch(trf.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all inline-flex items-center space-x-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {trf.status === 'DISPATCHED' && canManage && (
                            <button
                              onClick={() => handleReceive(trf.id)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
                          )}

                          {trf.status === 'RECEIVED' && (
                            <span className="text-xs font-mono text-slate-500 italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </FuturisticCard>

          {/* Create Transfer Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request Stock Transfer">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs font-mono mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Source Location (From)</label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Destination Location (To)</label>
                <select
                  value={destinationLocationId}
                  onChange={(e) => setDestinationLocationId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Item to Transfer</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-purple-900/30 border border-purple-400/30"
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

