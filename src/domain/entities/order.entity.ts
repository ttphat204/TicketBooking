export interface OrderItem {
  id: number;
  orderId: string; // Order ID is UNIQUEIDENTIFIER (string in TS)
  ticketCategoryId: number;
  quantity: number;
  priceAtBooking: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Expired';

export interface Order {
  id: string; // UNIQUEIDENTIFIER
  userId: number;
  totalAmount: number;
  discountAmount: number;
  voucherId?: number | null;
  status: OrderStatus;
  idempotencyKey: string;
  expiresAt: Date;
  createdAt: Date;
  items?: OrderItem[];
}
