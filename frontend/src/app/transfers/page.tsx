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
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { Plus, Send, CheckCircle2, ArrowRight, ArrowLeftRight, Terminal } from 'lucide-react';

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
    <div className="min-h-screen bg-cyber-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-4">
            <div>
              <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest text-neon-cyan flex items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-cyber-purple animate-pulse" />
                QUANTUM STOCK TRANSFERS
              </h1>
              <p className="text-xs font-mono-code text-cyber-cyan/70 mt-1">Transfer inventory between hub nodes with two-stage dispatch & receipt state machines.</p>
            </div>
            {canManage && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cyber-button px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>REQUEST TRANSFER</span>
              </button>
            )}
          </div>

          {/* Transfers Table */}
          <Cyber3DCard glowColor="purple" className="p-0 overflow-hidden bg-cyber-surface/90 border border-cyber-cyan/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code text-slate-300">
                <thead className="bg-cyber-bg/90 border-b border-cyber-cyan/30 text-[10px] font-orbitron font-bold text-cyber-cyan uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">TRANSFER VECTOR #</th>
                    <th className="px-6 py-4">SOURCE NODE</th>
                    <th className="px-6 py-4">DESTINATION NODE</th>
                    <th className="px-6 py-4">MATERIAL & SKU</th>
                    <th className="px-6 py-4 text-center">QUANTITY</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-right">WORKFLOW ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-cyan/10">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-cyber-cyan font-orbitron animate-pulse">SYNCHRONIZING TRANSFER VECTOR...</td>
                    </tr>
                  ) : transfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-orbitron">NO STOCK TRANSFERS RECORDED.</td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-cyber-cyan/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-cyber-cyan text-xs text-neon-cyan">{trf.transferNumber}</td>
                        <td className="px-6 py-4 font-bold text-white">{trf.sourceLocation.name}</td>
                        <td className="px-6 py-4 font-bold text-cyber-cyan flex items-center space-x-1">
                          <ArrowRight className="w-3.5 h-3.5 text-cyber-pink mr-1" />
                          <span>{trf.destinationLocation.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-xs">{trf.item.name}</div>
                          <div className="text-[10px] text-cyber-cyan">{trf.item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-white">{trf.quantity} {trf.item.unit}</td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={trf.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {trf.status === 'REQUESTED' && canManage && (
                            <button
                              onClick={() => handleDispatch(trf.id)}
                              className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-purple/50 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/30 transition-all inline-flex items-center space-x-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>DISPATCH</span>
                            </button>
                          )}

                          {trf.status === 'DISPATCHED' && canManage && (
                            <button
                              onClick={() => handleReceive(trf.id)}
                              className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-green/50 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/30 transition-all inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>RECEIVE STOCK</span>
                            </button>
                          )}

                          {trf.status === 'RECEIVED' && (
                            <span className="text-[10px] font-orbitron font-bold text-slate-500 italic">TRANSFERRED</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Cyber3DCard>

          {/* Create Transfer Cyber Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="REQUEST STOCK TRANSFER VECTOR">
            {error && (
              <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4">
                [ERROR]: {error}
              </div>
            )}
            <form onSubmit={handleCreateTransfer} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Source Node Hub (From)</label>
                <select
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Destination Node Hub (To)</label>
                <select
                  value={destinationLocationId}
                  onChange={(e) => setDestinationLocationId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Item Component</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-cyan/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-orbitron font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cyber-button px-5 py-2.5 rounded-xl text-xs"
                >
                  {submitting ? 'DISPATCHING...' : 'INITIATE TRANSFER'}
                </button>
              </div>
            </form>
          </Modal>

        </main>
      </div>
    </div>
  );
}
