'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../lib/socket';
import { apiRequest } from '../../lib/api';
import { CustomerOrder, Customer, Location, Item } from '../../types';
import { Cyber3DCard } from '../../components/Cyber3DCard';
import { Plus, UserPlus, ShieldCheck, XCircle, AlertTriangle, ShoppingCart } from 'lucide-react';

export default function CustomerOrdersPage() {
  const { user } = useAuth();
  const { subscribe } = useSocket();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalAlert, setGlobalAlert] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custError, setCustError] = useState('');

  // Order Modal
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(5);
  const [unitPrice, setUnitPrice] = useState(1500);
  const [orderError, setOrderError] = useState('');

  // Reserve Modal
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState('');
  const [reserveLocationId, setReserveLocationId] = useState('');
  const [reserveError, setReserveError] = useState('');

  const fetchOrdersData = async () => {
    try {
      const [ord, cust, inv] = await Promise.all([
        apiRequest('/orders'),
        apiRequest('/customers'),
        apiRequest('/inventory')
      ]);

      setOrders(ord);
      setCustomers(cust);

      const locMap = new Map();
      const itemMap = new Map();
      inv.forEach((i: any) => {
        locMap.set(i.location.id, i.location);
        itemMap.set(i.item.id, i.item);
      });
      const locList: Location[] = Array.from(locMap.values());
      const itemList: Item[] = Array.from(itemMap.values());
      setLocations(locList);
      setItems(itemList);

      if (cust.length > 0 && !selectedCustomerId) setSelectedCustomerId(cust[0].id);
      if (itemList.length > 0 && !selectedItemId) setSelectedItemId(itemList[0].id);
      if (locList.length > 0 && !reserveLocationId) setReserveLocationId(locList[0].id);
    } catch (err) {
      console.error('Failed loading orders data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersData();
  }, []);

  useEffect(() => {
    const unsubOrd = subscribe('ORDER_CREATED', fetchOrdersData);
    const unsubRes = subscribe('ORDER_RESERVED', fetchOrdersData);
    const unsubCan = subscribe('ORDER_CANCELLED', fetchOrdersData);
    const unsubInv = subscribe('INVENTORY_UPDATED', fetchOrdersData);
    return () => {
      unsubOrd();
      unsubRes();
      unsubCan();
      unsubInv();
    };
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustError('');
    try {
      const newCust = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: custName,
          phone: custPhone,
          email: custEmail,
          companyName: custCompany
        })
      });
      setIsCustomerModalOpen(false);
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setCustCompany('');
      fetchOrdersData();
      setSelectedCustomerId(newCust.id);
    } catch (err: any) {
      setCustError(err.message || 'Failed creating customer');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: [
            {
              itemId: selectedItemId,
              quantity: Number(orderQuantity),
              unitPrice: Number(unitPrice)
            }
          ]
        })
      });
      setIsOrderModalOpen(false);
      fetchOrdersData();
    } catch (err: any) {
      setOrderError(err.message || 'Failed creating order');
    }
  };

  const openReserveModal = (orderId: string) => {
    setTargetOrderId(orderId);
    setReserveError('');
    setIsReserveModalOpen(true);
  };

  const handleReserveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setReserveError('');
    setGlobalAlert(null);

    try {
      await apiRequest(`/orders/${targetOrderId}/reserve`, {
        method: 'POST',
        body: JSON.stringify({ locationId: reserveLocationId })
      });
      setIsReserveModalOpen(false);
      setGlobalAlert({ message: 'Stock successfully reserved inside PostgreSQL transaction!', type: 'success' });
      fetchOrdersData();
    } catch (err: any) {
      if (err.status === 409) {
        setReserveError(err.message || 'HTTP 409 Conflict: Over-reservation rejected!');
      } else {
        setReserveError(err.message || 'Failed stock reservation');
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Any reserved stock will be automatically released.')) return;
    try {
      await apiRequest(`/orders/${orderId}/cancel`, { method: 'POST' });
      setGlobalAlert({ message: 'Order cancelled and reserved stock released.', type: 'success' });
      fetchOrdersData();
    } catch (err: any) {
      alert(err.message || 'Failed cancelling order');
    }
  };

  const canSales = user?.role === 'ADMIN' || user?.role === 'SALES_USER';

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
                <ShoppingCart className="w-6 h-6 text-cyber-green animate-pulse" />
                CUSTOMER ORDERS & ATOMIC RESERVATION
              </h1>
              <p className="text-xs font-mono-code text-cyber-cyan/70 mt-1">Manage customer demand orders and execute atomic PostgreSQL SELECT FOR UPDATE stock reservations.</p>
            </div>
            {canSales && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs font-orbitron font-bold text-cyber-cyan border border-cyber-cyan/40 bg-cyber-cyan/10 hover:bg-cyber-cyan/30 px-3.5 py-2.5 rounded-xl transition-all flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ADD CLIENT</span>
                </button>
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="cyber-button px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>NEW ORDER DRAFT</span>
                </button>
              </div>
            )}
          </div>

          {globalAlert && (
            <div className={`p-4 rounded-xl border font-orbitron font-bold text-xs flex items-center justify-between ${
              globalAlert.type === 'error' ? 'bg-cyber-pink/10 border-cyber-pink/50 text-cyber-pink text-neon-pink' : 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green text-neon-green'
            }`}>
              <span>{globalAlert.message}</span>
              <button onClick={() => setGlobalAlert(null)} className="text-slate-400 hover:text-white font-bold text-base">×</button>
            </div>
          )}

          {/* Orders Table */}
          <Cyber3DCard glowColor="green" className="p-0 overflow-hidden bg-cyber-surface/90 border border-cyber-cyan/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono-code text-slate-300">
                <thead className="bg-cyber-bg/90 border-b border-cyber-cyan/30 text-[10px] font-orbitron font-bold text-cyber-cyan uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">DEMAND ORDER #</th>
                    <th className="px-6 py-4">CLIENT ENTITY</th>
                    <th className="px-6 py-4">REQUESTED ITEMS</th>
                    <th className="px-6 py-4 text-center">TOTAL QUANTITY</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="px-6 py-4 text-right">WORKFLOW ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-cyan/10">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-cyber-cyan font-orbitron animate-pulse">SYNCHRONIZING CUSTOMER ORDERS...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-orbitron">NO DEMAND ORDERS RECORDED.</td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const totalQty = ord.items.reduce((sum, i) => sum + i.quantity, 0);
                      return (
                        <tr key={ord.id} className="hover:bg-cyber-cyan/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-cyber-green text-xs text-neon-green">{ord.orderNumber}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-xs">{ord.customer.name}</div>
                            <div className="text-[10px] text-cyber-cyan">{ord.customer.companyName}</div>
                          </td>
                          <td className="px-6 py-4">
                            {ord.items.map((item) => (
                              <div key={item.id} className="text-xs">
                                <span className="font-bold text-white">{item.item.name}</span>{' '}
                                <span className="text-cyber-cyan">({item.quantity} {item.item.unit} @ ₹{item.unitPrice})</span>
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-white">{totalQty} units</td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={ord.status} />
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {ord.status === 'DRAFT' && canSales && (
                              <button
                                onClick={() => openReserveModal(ord.id)}
                                className="text-[10px] font-orbitron font-bold px-3 py-1.5 rounded-lg border border-cyber-green/50 bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/30 transition-all inline-flex items-center space-x-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>LOCK STOCK</span>
                              </button>
                            )}

                            {ord.status !== 'CANCELLED' && canSales && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="text-[10px] font-orbitron font-bold px-2.5 py-1.5 rounded-lg border border-cyber-pink/40 bg-cyber-pink/10 text-cyber-pink hover:bg-cyber-pink/30 transition-all inline-flex items-center space-x-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>CANCEL</span>
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

          {/* Add Customer Cyber Modal */}
          <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="REGISTER CLIENT ENTITY">
            {custError && <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4">[ERROR]: {custError}</div>}
            <form onSubmit={handleCreateCustomer} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Full Client Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Telephone Contact</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Email Matrix Address</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Company Entity</label>
                <input
                  type="text"
                  value={custCompany}
                  onChange={(e) => setCustCompany(e.target.value)}
                  required
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-cyan/20">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-xs font-orbitron font-bold text-slate-400">ABORT</button>
                <button type="submit" className="cyber-button px-5 py-2.5 rounded-xl text-xs">REGISTER CLIENT</button>
              </div>
            </form>
          </Modal>

          {/* New Order Cyber Modal */}
          <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="GENERATE DEMAND ORDER DRAFT">
            {orderError && <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4">[ERROR]: {orderError}</div>}
            <form onSubmit={handleCreateOrder} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Select Client Entity</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Item Requested</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>
                <div>
                  <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    required
                    className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-cyber-cyan/20">
                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 text-xs font-orbitron font-bold text-slate-400">ABORT</button>
                <button type="submit" className="cyber-button px-5 py-2.5 rounded-xl text-xs">CREATE DRAFT ORDER</button>
              </div>
            </form>
          </Modal>

          {/* Stock Reservation Cyber Modal */}
          <Modal isOpen={isReserveModalOpen} onClose={() => setIsReserveModalOpen(false)} title="EXECUTE POSTGRESQL ATOMIC RESERVATION">
            {reserveError && (
              <div className="bg-cyber-pink/10 border border-cyber-pink/50 text-cyber-pink p-3 rounded-xl text-xs font-orbitron font-bold mb-4 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-cyber-pink shrink-0 mt-0.5" />
                <span>{reserveError}</span>
              </div>
            )}
            <form onSubmit={handleReserveStock} className="space-y-4 font-mono-code text-xs">
              <div>
                <label className="block font-orbitron font-bold text-[10px] text-cyber-cyan uppercase mb-1">Warehouse Node Hub for Row Lock</label>
                <select
                  value={reserveLocationId}
                  onChange={(e) => setReserveLocationId(e.target.value)}
                  className="w-full bg-cyber-bg border border-cyber-cyan/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyber-cyan"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-cyber-cyan/10 rounded-xl border border-cyber-cyan/30 text-[11px] text-cyber-cyan font-mono-code">
                <strong>ATOMIC TRANSACTION SAFETY:</strong> This will execute a PostgreSQL transaction with explicit row-locking (`SELECT ... FOR UPDATE`). If available stock is insufficient, the transaction will roll back and return HTTP 409 Conflict.
              </div>

              <div className="flex justify-end space-x-3 pt-2 border-t border-cyber-cyan/20">
                <button type="button" onClick={() => setIsReserveModalOpen(false)} className="px-4 py-2 text-xs font-orbitron font-bold text-slate-400">ABORT</button>
                <button type="submit" className="cyber-button px-5 py-2.5 rounded-xl text-xs">CONFIRM & LOCK STOCK</button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
