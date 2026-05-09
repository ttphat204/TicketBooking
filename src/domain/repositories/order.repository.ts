import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: number): Promise<Order[]>;
  findByIdempotencyKey(key: string): Promise<Order | null>;
  updateStatus(id: string, status: string): Promise<void>;
  findExpiredOrders(): Promise<Order[]>;
  cancelOrderWithCompensation(orderId: string): Promise<void>;
}
