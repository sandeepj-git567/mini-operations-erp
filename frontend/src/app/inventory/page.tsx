'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Inventory, InventoryTransaction, Location } from '../../types';
import { Plus, History, AlertTriangle, RefreshCw } from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState('');
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
      if (filterLocation) query += `locationId=${filterLocation}&`;
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
  }, [filterLocation, filterLowStock]);

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Inventory Control</h1>
              <p className="text-sm text-slate-500">Live physical, reserved, and available stock levels across warehouse locations.</p>
            </div>
            {canAdjust && (
              <button
                onClick={() => openAdjustModal()}
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-sky-600/30 transition-all flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Adjust Stock</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Low Stock Only (&lt;10 Available)
                </span>
              </label>
            </div>

            <button
              onClick={fetchInventoryData}
              className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors text-sm flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">SKU & Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Physical Qty</th>
                    <th className="px-6 py-4 text-center">Reserved Qty</th>
                    <th className="px-6 py-4 text-center">Available Qty</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading inventory data...</td>
                    </tr>
                  ) : inventories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No inventory records found.</td>
                    </tr>
                  ) : (
                    inventories.map((inv) => {
                      const isLow = inv.availableQuantity < 10;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono font-bold text-sky-600 text-xs">{inv.item.sku}</div>
                            <div className="font-semibold text-slate-800">{inv.item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{inv.item.category?.name}</td>
                          <td className="px-6 py-4 text-slate-700 font-semibold">{inv.location.name}</td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">{inv.physicalQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-amber-600">{inv.reservedQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${
                              isLow ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {inv.availableQuantity} {inv.item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {canAdjust && (
                              <button
                                onClick={() => openAdjustModal(inv)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
                              >
                                Adjust
                              </button>
                            )}
                            <button
                              onClick={() => openLogsModal(inv)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors inline-flex items-center space-x-1"
                              title="Audit History"
                            >
                              <History className="w-3.5 h-3.5" />
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
          </div>

          {/* Adjust Stock Modal */}
          <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Adjust Inventory Quantity">
            {adjustError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4">
                {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Item & Location</label>
                <select
                  value={`${adjustItemId}_${adjustLocationId}`}
                  onChange={(e) => {
                    const [item, loc] = e.target.value.split('_');
                    setAdjustItemId(item);
                    setAdjustLocationId(loc);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                >
                  {inventories.map((inv) => (
                    <option key={inv.id} value={`${inv.itemId}_${inv.locationId}`}>
                      {inv.item.sku} - {inv.item.name} ({inv.location.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity Adjustment (+ or -)</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Use positive numbers for intake (e.g. +20), negative for deduction (e.g. -5).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason / Justification</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-xl transition-colors shadow-md"
                >
                  {adjustSubmitting ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Audit Logs Modal */}
          <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title={`Inventory Audit Logs - ${selectedInvTitle}`}>
            <div className="space-y-3">
              {selectedInvLogs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No audit transactions recorded yet.</p>
              ) : (
                selectedInvLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-sky-600">{log.movementType}</span>
                      <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-700 font-medium">{log.reason}</div>
                    <div className="text-slate-400 flex justify-between">
                      <span>Quantity: <strong className="text-slate-800">{log.quantity}</strong></span>
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
