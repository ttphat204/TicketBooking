import { IOrderRepository } from '../../domain/repositories/order.repository';

export class CancelExpiredOrdersUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(): Promise<number> {
    const expiredOrders = await this.orderRepo.findExpiredOrders();
    
    if (expiredOrders.length === 0) return 0;

    console.log(`[Worker] Found ${expiredOrders.length} expired orders. Processing...`);

    for (const order of expiredOrders) {
      try {
        await this.orderRepo.cancelOrderWithCompensation(order.id);
        console.log(`[Worker] Order ${order.id} cancelled and stock released.`);
      } catch (err) {
        console.error(`[Worker] Failed to cancel order ${order.id}:`, err);
      }
    }

    return expiredOrders.length;
  }
}
