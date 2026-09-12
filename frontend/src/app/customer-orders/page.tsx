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
import { Plus, UserPlus, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Customer Orders & Stock Reservation</h1>
              <p className="text-sm text-slate-500">Manage customer sales orders and execute atomic PostgreSQL stock reservation transactions.</p>
            </div>
            {canSales && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center space-x-2 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Customer</span>
                </button>
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Customer Order</span>
                </button>
              </div>
            )}
          </div>

          {globalAlert && (
            <div className={`p-4 rounded-xl border font-medium text-sm flex items-center justify-between ${
              globalAlert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span>{globalAlert.message}</span>
              <button onClick={() => setGlobalAlert(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>
          )}

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Order Items</th>
                    <th className="px-6 py-4 text-center">Total Quantity</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Workflow Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading customer orders...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No customer orders recorded.</td>
                    </tr>
                  ) : (
                    orders.map((ord) => {
                      const totalQty = ord.items.reduce((sum, i) => sum + i.quantity, 0);
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600">{ord.orderNumber}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{ord.customer.name}</div>
                            <div className="text-xs text-slate-400">{ord.customer.companyName}</div>
                          </td>
                          <td className="px-6 py-4">
                            {ord.items.map((item) => (
                              <div key={item.id} className="text-xs">
                                <span className="font-semibold text-slate-800">{item.item.name}</span>{' '}
                                <span className="text-slate-500 font-mono">({item.quantity} {item.item.unit} @ ₹{item.unitPrice})</span>
                              </div>
                            ))}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-800">{totalQty} units</td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={ord.status} />
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {ord.status === 'DRAFT' && canSales && (
                              <button
                                onClick={() => openReserveModal(ord.id)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors inline-flex items-center space-x-1"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Reserve Stock</span>
                              </button>
                            )}

                            {ord.status !== 'CANCELLED' && canSales && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors inline-flex items-center space-x-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
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

          {/* Add Customer Modal */}
          <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Create New Customer">
            {custError && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4">{custError}</div>}
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                <input
                  type="text"
                  value={custCompany}
                  onChange={(e) => setCustCompany(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 rounded-xl">Save Customer</button>
              </div>
            </form>
          </Modal>

          {/* New Order Modal */}
          <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} title="Create New Customer Order">
            {orderError && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4">{orderError}</div>}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item Requested</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl">Create Order Draft</button>
              </div>
            </form>
          </Modal>

          {/* Stock Reservation Modal */}
          <Modal isOpen={isReserveModalOpen} onClose={() => setIsReserveModalOpen(false)} title="Execute PostgreSQL Stock Reservation">
            {reserveError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium mb-4 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{reserveError}</span>
              </div>
            )}
            <form onSubmit={handleReserveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Warehouse Location for Stock Lock</label>
                <select
                  value={reserveLocationId}
                  onChange={(e) => setReserveLocationId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.code})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Transaction Safety:</strong> This action will execute a PostgreSQL transaction with explicit row-locking (`SELECT ... FOR UPDATE`). If available stock is insufficient, the transaction will rollback and return HTTP 409 Conflict.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsReserveModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md">Confirm & Lock Stock</button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}
