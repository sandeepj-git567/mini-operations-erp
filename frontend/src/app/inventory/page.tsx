'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Inventory, InventoryTransaction } from '../../types';
import { FuturisticCard } from '../../components/FuturisticCard';
import { Plus, History, AlertTriangle, RefreshCw, Boxes } from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modal States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustLocationId, setAdjustLocationId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState(10);
  const [adjustReason, setAdjustReason] = useState('Manual stock replenishment');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Audit Logs Drawer
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [selectedInvLogs, setSelectedInvLogs] = useState<InventoryTransaction[]>([]);
  const [selectedInvTitle, setSelectedInvTitle] = useState('');

  const fetchInventoryData = async () => {
    try {
      let query = '?';
      if (filterLowStock) query += `lowStock=true&`;

      const data = await apiRequest(`/inventory${query}`);
      setInventories(data);
    } catch (err) {
      console.error('Failed fetching inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [filterLowStock]);

  useEffect(() => {
    const unsub = subscribe('INVENTORY_UPDATED', (payload: any) => {
      console.log('[Realtime UI Update] INVENTORY_UPDATED event received', payload);
      fetchInventoryData();
    });
    return () => unsub();
  }, []);

  const openAdjustModal = (inv?: Inventory) => {
    if (inv) {
      setAdjustItemId(inv.itemId);
      setAdjustLocationId(inv.locationId);
    } else if (inventories.length > 0) {
      setAdjustItemId(inventories[0].itemId);
      setAdjustLocationId(inventories[0].locationId);
    }
    setAdjustQuantity(10);
    setAdjustReason('Manual stock intake');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSubmitting(true);

    try {
      await apiRequest('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          itemId: adjustItemId,
          locationId: adjustLocationId,
          quantity: Number(adjustQuantity),
          reason: adjustReason
        })
      });
      setIsAdjustModalOpen(false);
      fetchInventoryData();
    } catch (err: any) {
      setAdjustError(err.message || 'Failed adjusting stock');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const openLogsModal = async (inv: Inventory) => {
    try {
      const logs = await apiRequest(`/inventory/${inv.id}/transactions`);
      setSelectedInvLogs(logs);
      setSelectedInvTitle(`${inv.item.name} (${inv.location.name})`);
      setIsLogsModalOpen(true);
    } catch (err) {
      console.error('Failed loading audit transactions', err);
    }
  };

  const canAdjust = user?.role === 'ADMIN' || user?.role === 'OPERATIONS_USER';

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
                <Boxes className="w-6 h-6 text-sky-400" />
                INVENTORY CONTROL MATRIX
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">Live physical, reserved, and available stock metrics across warehouse nodes.</p>
            </div>
            {canAdjust && (
              <button
                onClick={() => openAdjustModal()}
                className="btn-futuristic px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Adjust Stock</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <FuturisticCard glow="cyan" className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs font-outfit font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-400 focus:ring-sky-400 w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Low Stock Alert (&lt;10 Available)
                </span>
              </label>
            </div>

            <button
              onClick={fetchInventoryData}
              className="text-xs font-outfit font-bold text-sky-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-sky-500/40 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Matrix</span>
            </button>
          </FuturisticCard>

          {/* Inventory Data Table */}
          <FuturisticCard glow="indigo" className="p-0 overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-outfit font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">SKU & Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location Hub</th>
                    <th className="px-6 py-4 text-center">Physical Qty</th>
                    <th className="px-6 py-4 text-center">Reserved Qty</th>
                    <th className="px-6 py-4 text-center">Available Qty</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sky-400 font-outfit font-bold animate-pulse">Loading Inventory Matrix...</td>
                    </tr>
                  ) : inventories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-outfit">No inventory records found.</td>
                    </tr>
                  ) : (
                    inventories.map((inv) => {
                      const isLow = inv.availableQuantity < 10;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono-code font-bold text-sky-400 text-xs">{inv.item.sku}</div>
                            <div className="font-outfit font-bold text-white text-xs">{inv.item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{inv.item.category?.name}</td>
                          <td className="px-6 py-4 text-sky-300 font-bold">{inv.location.name}</td>
                          <td className="px-6 py-4 text-center font-bold text-white">{inv.physicalQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-amber-400">{inv.reservedQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full font-outfit font-bold text-[11px] border ${
                              isLow ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {inv.availableQuantity} {inv.item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {canAdjust && (
                              <button
                                onClick={() => openAdjustModal(inv)}
                                className="text-[11px] font-outfit font-bold px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-all"
                              >
                                Adjust
                              </button>
                            )}
                            <button
                              onClick={() => openLogsModal(inv)}
                              className="text-[11px] font-outfit font-bold px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-all inline-flex items-center space-x-1"
                            >
                              <History className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Logs</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </FuturisticCard>

          {/* Adjust Stock Modal */}
          <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Adjust Inventory Quantity">
            {adjustError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold mb-4">
                {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjustSubmit} className="space-y-4 font-medium text-xs">
              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Target Item & Location</label>
                <select
                  value={`${adjustItemId}_${adjustLocationId}`}
                  onChange={(e) => {
                    const [item, loc] = e.target.value.split('_');
                    setAdjustItemId(item);
                    setAdjustLocationId(loc);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {inventories.map((inv) => (
                    <option key={inv.id} value={`${inv.itemId}_${inv.locationId}`}>
                      {inv.item.sku} - {inv.item.name} ({inv.location.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Quantity Adjustment Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Use positive numbers for intake (+20), negative for deduction (-5).</p>
              </div>

              <div>
                <label className="block font-outfit font-bold text-xs text-slate-300 uppercase mb-1">Reason / Justification</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-outfit font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="btn-futuristic px-5 py-2.5 rounded-xl text-xs"
                >
                  {adjustSubmitting ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Audit Logs Modal */}
          <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title={`Inventory Audit Logs - ${selectedInvTitle}`}>
            <div className="space-y-3 font-medium text-xs">
              {selectedInvLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-outfit">No audit transactions recorded.</p>
              ) : (
                selectedInvLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-outfit font-bold text-sky-400">{log.movementType}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300 font-semibold">{log.reason}</div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Quantity: <strong className="text-emerald-400">{log.quantity}</strong></span>
                      <span>By: {log.createdBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Modal>

        </main>
      </div>
    </div>
  );
}
