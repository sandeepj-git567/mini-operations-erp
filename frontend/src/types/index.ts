export type Role = 'ADMIN' | 'OPERATIONS_USER' | 'SALES_USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationId?: string;
  location?: Location;
}

export interface Location {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  category?: Category;
  unit: string;
  active: boolean;
}

export interface Inventory {
  id: string;
  itemId: string;
  item: Item;
  locationId: string;
  location: Location;
  physicalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  quantity: number;
  movementType: 'IN' | 'OUT' | 'RESERVE' | 'RELEASE' | 'TRANSFER_OUT' | 'TRANSFER_IN';
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  locationId: string;
  location: Location;
  itemId: string;
  item: Item;
  requiredQuantity: number;
  assignedUserId: string;
  assignedUser: User;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  availableQuantity: number;
  shortageQuantity: number;
  createdBy: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  transferNumber: string;
  sourceLocationId: string;
  sourceLocation: Location;
  destinationLocationId: string;
  destinationLocation: Location;
  itemId: string;
  item: Item;
  quantity: number;
  status: 'REQUESTED' | 'DISPATCHED' | 'RECEIVED';
  createdBy: string;
  dispatchedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
}

export interface CustomerOrderItem {
  id: string;
  orderId: string;
  itemId: string;
  item: Item;
  quantity: number;
  unitPrice: number;
  reservations?: any[];
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdBy: string;
  items: CustomerOrderItem[];
  createdAt: string;
}
