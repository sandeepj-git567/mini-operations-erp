'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { Inventory, InventoryTransaction } from '../../types';
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { Plus, History, AlertTriangle, RefreshCw, Boxes, Terminal } from 'lucide-react';

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
    <div className="min-h-screen bg-cyber-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6">
          
          {/* Title Bar */}
          <div className="flex items-center justify-between border-b border-cyber-cyan/20 pb-4">
            <div>
              <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-widest text-neon-cyan flex items-center gap-2">
                <Boxes className="w-6 h-6 text-cyber-cyan animate-pulse" />
                QUANTUM INVENTORY MATRIX
              </h1>
              <p className="text-xs font-mono-code text-cyber-cyan/70 mt-1">Live physical, reserved, and available stock metrics across node warehouses.</p>
            </div>
            {canAdjust && (
              <button
                onClick={() => openAdjustModal()}
                className="cyber-button px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>ADJUST STOCK</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <Cyber3DCard glowColor="cyan" className="p-4 bg-cyber-surface/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-xs font-orbitron font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                  className="rounded border-cyber-cyan bg-cyber-bg text-cyber-cyan focus:ring-cyber-cyan w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-cyber-yellow">
                  <AlertTriangle className="w-4 h-4 text-cyber-yellow animate-pulse" />
                  LOW STOCK ALERT (&lt;10 AVAILABLE)
                </span>
              </label>
            </div>

            <button
              onClick={fetchInventoryData}
              className="text-xs font-orbitron font-bold text-cyber-cyan hover:text-white px-3 py-1.5 rounded-lg border border-cyber-cyan/30 hover:border-cyber-cyan transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC MATRIX</span>
            </button>
          </Cyber3DCard>

          {/* Holographic Inventory Table */}
          <Cyber3DCard glowColor="purple" className="p-0 overflow-hidden bg-cyber-surface/90 border border-cyber-cyan/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code text-slate-300">
                <thead className="bg-cyber-bg/90 border-b border-cyber-cyan/30 text-[10px] font-orbitron font-bold text-cyber-cyan uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">SKU & ITEM MATRIX</th>
                    <th className="px-6 py-4">CATEGORY</th>
                    <th className="px-6 py-4">LOCATION HUB</th>
                    <th className="px-6 py-4 text-center">PHYSICAL QTY</th>
                    <th className="px-6 py-4 text-center">RESERVED QTY</th>
                    <th className="px-6 py-4 text-center">AVAILABLE QTY</th>
                    <th className="px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-cyan/10">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-cyber-cyan font-orbitron animate-pulse">SYNCHRONIZING INVENTORY DATA...</td>
                    </tr>
                  ) : inventories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500 font-orbitron">NO MATRIX RECORDS FOUND.</td>
                    </tr>
                  ) : (
                    inventories.map((inv) => {
                      const isLow = inv.availableQuantity < 10;
                      return (
                        <tr key={inv.id} className="hover:bg-cyber-cyan/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-cyber-cyan text-xs text-neon-cyan">{inv.item.sku}</div>
                            <div className="font-bold text-white text-xs">{inv.item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">{inv.item.category?.name}</td>
                          <td className="px-6 py-4 text-cyber-cyan font-bold">{inv.location.name}</td>
                          <td className="px-6 py-4 text-center font-bold text-white">{inv.physicalQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center font-bold text-cyber-yellow">{inv.reservedQuantity} {inv.item.unit}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md font-orbitron font-bold text-[10px] border ${
                              isLow ? 'bg-cyber-pink/10 text-cyber-pink border-cyber-pink/50 text-neon-pink' : 'bg-cyber-green/10 text-cyber-green border-cyber-green/50 text-neon-green'
                            }`}>
                              {inv.availableQuantity} {inv.item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {canAdjust && (
                              <button
                                onClick={() => openAdjustModal(inv)}
                                className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/30 hover:border-cyber-cyan transition-all"
                              >
                                ADJUST
                              </button>
                            )}
                            <button
                              onClick={() => openLogsModal(inv)}
                              className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-bg text-slate-300 hover:text-white hover:border-cyber-purple transition-all inline-flex items-center space-x-1"
                            >
                              <History className="w-3 h-3 text-cyber-purple" />
                              <span>LOGS</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Cyber3DCard>

          {/* Adjust Stock Cyber Modal */}
          <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="ADJUST PHYSICAL STOCK">
            {adjustError && (
              <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4">
                [ERROR]: {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjustSubmit} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Target Item Matrix & Location</label>
                <select
                  value={`${adjustItemId}_${adjustLocationId}`}
                  onChange={(e) => {
                    const [item, loc] = e.target.value.split('_');
                    setAdjustItemId(item);
                    setAdjustLocationId(loc);
                  }}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {inventories.map((inv) => (
                    <option key={inv.id} value={`${inv.itemId}_${inv.locationId}`}>
                      {inv.item.sku} - {inv.item.name} ({inv.location.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Quantity Adjustment Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
                <p className="text-[10px] text-slate-500 mt-1">Positive delta for stock intake (+50), negative for deduction (-10).</p>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Audit Protocol Reason</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-cyan/20">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-orbitron font-bold text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="cyber-button px-5 py-2.5 rounded-xl text-xs"
                >
                  {adjustSubmitting ? 'COMMITTING...' : 'COMMIT ADJUSTMENT'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Audit Logs Cyber Modal */}
          <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title={`AUDIT TELEMETRY - ${selectedInvTitle}`}>
            <div className="space-y-3 font-mono-code text-xs">
              {selectedInvLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-orbitron">NO TRANSACTIONS RECORDED IN AUDIT LOG.</p>
              ) : (
                selectedInvLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-cyber-bg/90 rounded-xl border border-cyber-cyan/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-cyber-cyan">{log.movementType}</span>
                      <span className="text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300 font-semibold">{log.reason}</div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>DELTA: <strong className="text-cyber-green">{log.quantity}</strong></span>
                      <span>OPERATOR: {log.createdBy}</span>
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
