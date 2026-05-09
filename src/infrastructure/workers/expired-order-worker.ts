import { CancelExpiredOrdersUseCase } from '../../application/use-cases/cancel-expired-orders.use-case';
import { OrderRepository } from '../repositories/order.repository.impl';

export class ExpiredOrderWorker {
  private useCase: CancelExpiredOrdersUseCase;
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    const orderRepo = new OrderRepository();
    this.useCase = new CancelExpiredOrdersUseCase(orderRepo);
  }

  start(intervalMs: number = 60000) { // Default every 1 minute
    console.log('[Worker] Expired Order Worker started.');
    this.interval = setInterval(async () => {
      try {
        await this.useCase.execute();
      } catch (err) {
        console.error('[Worker] Error in ExpiredOrderWorker:', err);
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('[Worker] Expired Order Worker stopped.');
    }
  }
}
