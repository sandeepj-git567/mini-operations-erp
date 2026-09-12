'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { WorkOrder, Location, Item } from '../../types';
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { Plus, ArrowLeftRight, AlertCircle, CheckCircle2, ClipboardList, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [locationId, setLocationId] = useState('');
  const [itemId, setItemId] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState(50);
  const [assignedUserId, setAssignedUserId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkOrdersData = async () => {
    try {
      const [wo, inv] = await Promise.all([
        apiRequest('/work-orders'),
        apiRequest('/inventory')
      ]);

      setWorkOrders(wo);

      const locMap = new Map();
      const itemMap = new Map();
      inv.forEach((i: any) => {
        locMap.set(i.location.id, i.location);
        itemMap.set(i.item.id, i.item);
      });
      setLocations(Array.from(locMap.values()));
      setItems(Array.from(itemMap.values()));

      if (locMap.size > 0 && !locationId) setLocationId(Array.from(locMap.keys())[0]);
      if (itemMap.size > 0 && !itemId) setItemId(Array.from(itemMap.keys())[0]);
      if (user) setAssignedUserId(user.id);
    } catch (err) {
      console.error('Failed loading work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrdersData();
  }, []);

  useEffect(() => {
    const unsubWO = subscribe('WORK_ORDER_CREATED', fetchWorkOrdersData);
    const unsubWOUp = subscribe('WORK_ORDER_UPDATED', fetchWorkOrdersData);
    const unsubInv = subscribe('INVENTORY_UPDATED', fetchWorkOrdersData);
    return () => {
      unsubWO();
      unsubWOUp();
      unsubInv();
    };
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiRequest('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          locationId,
          itemId,
          requiredQuantity: Number(requiredQuantity),
          assignedUserId
        })
      });
      setIsModalOpen(false);
      fetchWorkOrdersData();
    } catch (err: any) {
      setError(err.message || 'Failed creating work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (woId: string, newStatus: string) => {
    try {
      await apiRequest(`/work-orders/${woId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      fetchWorkOrdersData();
    } catch (err: any) {
      alert(err.message || 'Failed updating work order status');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

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
                <ClipboardList className="w-6 h-6 text-cyber-yellow animate-pulse" />
                WORK ORDERS & SHORTAGE MATRIX
              </h1>
              <p className="text-xs font-mono-code text-cyber-cyan/70 mt-1">Plan production material requirements and compute real-time stock shortages.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="cyber-button px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE WORK ORDER</span>
              </button>
            )}
          </div>

          {/* Work Orders Table */}
          <Cyber3DCard glowColor="purple" className="p-0 overflow-hidden bg-cyber-surface/90 border border-cyber-cyan/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code text-slate-300">
                <thead className="bg-cyber-bg/90 border-b border-cyber-cyan/30 text-[10px] font-orbitron font-bold text-cyber-cyan uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">WO PROTOCOL #</th>
                    <th className="px-6 py-4">LOCATION HUB</th>
                    <th className="px-6 py-4">REQUIRED MATERIAL</th>
                    <th className="px-6 py-4 text-center">REQUIRED QTY</th>
                    <th className="px-6 py-4 text-center">AVAILABLE STOCK</th>
                    <th className="px-6 py-4 text-center">SHORTAGE MATRIX</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-cyan/10">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-cyber-cyan font-orbitron animate-pulse">SYNCHRONIZING WORK ORDERS...</td>
                    </tr>
                  ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-orbitron">NO WORK ORDERS CREATED.</td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => {
                      const hasShortage = wo.shortageQuantity > 0;
                      return (
                        <tr key={wo.id} className="hover:bg-cyber-cyan/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-cyber-cyan text-xs text-neon-cyan">{wo.workOrderNumber}</td>
                          <td className="px-6 py-4 font-bold text-white">{wo.location.name}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-xs">{wo.item.name}</div>
                            <div className="text-[10px] text-cyber-cyan">{wo.item.sku}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-white">{wo.requiredQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-cyber-cyan">{wo.availableQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            {hasShortage ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink rounded-md font-orbitron font-bold text-[10px] text-neon-pink">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{wo.shortageQuantity} SHORTAGE</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-cyber-green/10 border border-cyber-green/50 text-cyber-green rounded-md font-orbitron font-bold text-[10px] text-neon-green">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>SUFFICIENT</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={wo.status} />
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {hasShortage && (
                              <Link
                                href="/transfers"
                                className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-purple/50 bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/30 transition-all inline-flex items-center space-x-1"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>TRANSFER</span>
                              </Link>
                            )}

                            {wo.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'IN_PROGRESS')}
                                className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-yellow/50 bg-cyber-yellow/10 text-cyber-yellow hover:bg-cyber-yellow/30 transition-all"
                              >
                                START
                              </button>
                            )}

                            {wo.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'COMPLETED')}
                                className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-green/50 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/30 transition-all"
                              >
                                COMPLETE
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Cyber3DCard>

          {/* Create Work Order Cyber Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="CREATE PRODUCTION WORK ORDER">
            {error && (
              <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4">
                [ERROR]: {error}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Target Location Hub</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Required Material / Component</label>
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
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Required Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
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
                  {submitting ? 'GENERATING...' : 'ISSUE WORK ORDER'}
                </button>
              </div>
            </form>
          </Modal>

        </main>
      </div>
    </div>
  );
}
