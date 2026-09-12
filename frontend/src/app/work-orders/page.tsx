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
import { FuturisticCard } from '../../components/FuturisticCard';
import { Plus, ArrowLeftRight, AlertCircle, CheckCircle2, ClipboardList } from 'lucide-react';
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
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h1 className="text-2xl font-outfit font-extrabold text-white tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-amber-400" />
                WORK ORDERS & SHORTAGE MATRIX
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Plan production material requirements and compute real-time stock shortages.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-futuristic px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Work Order</span>
              </button>
            )}
          </div>

          {/* Work Orders Table */}
          <FuturisticCard glow="amber" className="p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">WO #</th>
                    <th className="px-6 py-4">Location Hub</th>
                    <th className="px-6 py-4">Required Material</th>
                    <th className="px-6 py-4 text-center">Required Qty</th>
                    <th className="px-6 py-4 text-center">Available Stock</th>
                    <th className="px-6 py-4 text-center">Stock Shortage</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sky-400 font-outfit font-bold animate-pulse">Loading Work Orders...</td>
                    </tr>
                  ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-outfit">No work orders created.</td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => {
                      const hasShortage = wo.shortageQuantity > 0;
                      return (
                        <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono-code font-bold text-sky-400 text-xs">{wo.workOrderNumber}</td>
                          <td className="px-6 py-4 font-outfit font-bold text-white">{wo.location.name}</td>
                          <td className="px-6 py-4">
                            <div className="font-outfit font-bold text-white text-xs">{wo.item.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono-code">{wo.item.sku}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-white">{wo.requiredQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-sky-400">{wo.availableQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            {hasShortage ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full font-outfit font-bold text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{wo.shortageQuantity} Shortage</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-outfit font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Sufficient</span>
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
                                className="text-[11px] font-outfit font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all inline-flex items-center space-x-1"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Transfer</span>
                              </Link>
                            )}

                            {wo.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'IN_PROGRESS')}
                                className="text-[11px] font-outfit font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                              >
                                Start
                              </button>
                            )}

                            {wo.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'COMPLETED')}
                                className="text-[11px] font-outfit font-bold px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
                              >
                                Complete
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
          </FuturisticCard>

          {/* Create Work Order Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Production Work Order">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4 font-medium text-xs">
              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Target Location Hub</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Required Material / Component</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Required Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-outfit font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-futuristic px-5 py-2.5 rounded-xl text-xs"
                >
                  {submitting ? 'Creating...' : 'Issue Work Order'}
                </button>
              </div>
            </form>
          </Modal>

        </main>
      </div>
    </div>
  );
}
