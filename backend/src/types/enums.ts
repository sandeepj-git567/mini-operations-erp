export enum Role {
  ADMIN = 'ADMIN',
  OPERATIONS_USER = 'OPERATIONS_USER',
  SALES_USER = 'SALES_USER'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  RESERVE = 'RESERVE',
  RELEASE = 'RELEASE',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN'
}

export enum WorkOrderStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TransferStatus {
  REQUESTED = 'REQUESTED',
  DISPATCHED = 'DISPATCHED',
  RECEIVED = 'RECEIVED'
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED'
}
