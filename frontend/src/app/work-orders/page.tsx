'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { WorkOrder, Location, Item, User } from '../../types';
import { Plus, ArrowLeftRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [opsUsers, setOpsUsers] = useState<User[]>([]);
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
      const [wo, inv, users] = await Promise.all([
        apiRequest('/work-orders'),
        apiRequest('/inventory'),
        apiRequest('/auth/me') // or users endpoint fallback
      ]);

      setWorkOrders(wo);

      // Extract unique locations and items from inventory
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Work Orders & Stock Check</h1>
              <p className="text-sm text-slate-500">Plan production material requirements and calculate stock shortages.</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/30 transition-all flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Work Order</span>
              </button>
            )}
          </div>

          {/* Work Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">WO #</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Required Item</th>
                    <th className="px-6 py-4 text-center">Required Qty</th>
                    <th className="px-6 py-4 text-center">Available Stock</th>
                    <th className="px-6 py-4 text-center">Stock Shortage</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">Loading work orders...</td>
                    </tr>
                  ) : workOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">No work orders created.</td>
                    </tr>
                  ) : (
                    workOrders.map((wo) => {
                      const hasShortage = wo.shortageQuantity > 0;
                      return (
                        <tr key={wo.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-sky-600">{wo.workOrderNumber}</td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{wo.location.name}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{wo.item.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{wo.item.sku}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">{wo.requiredQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-700">{wo.availableQuantity} {wo.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            {hasShortage ? (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full font-bold text-xs">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{wo.shortageQuantity} Shortage</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-xs">
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
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors inline-flex items-center space-x-1"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Request Transfer</span>
                              </Link>
                            )}

                            {wo.status === 'ASSIGNED' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'IN_PROGRESS')}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                Start Progress
                              </button>
                            )}

                            {wo.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleStatusChange(wo.id, 'COMPLETED')}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
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
          </div>

          {/* Create Work Order Modal */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Production Work Order">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Location</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Material / Item Required</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>{it.sku} - {it.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Required Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={requiredQuantity}
                  onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
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
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
