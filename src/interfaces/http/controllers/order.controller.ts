import { Request, Response } from 'express';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order.use-case';
import { OrderRepository } from '../../../infrastructure/repositories/order.repository.impl';
import { ConcertRepository } from '../../../infrastructure/repositories/concert.repository.impl';
import { VoucherRepository } from '../../../infrastructure/repositories/voucher.repository.impl';

export class OrderController {
  private createOrderUseCase: CreateOrderUseCase;

  constructor() {
    const orderRepo = new OrderRepository();
    const concertRepo = new ConcertRepository();
    const voucherRepo = new VoucherRepository();
    this.createOrderUseCase = new CreateOrderUseCase(orderRepo, concertRepo, voucherRepo);
  }

  async create(req: Request, res: Response) {
    try {
      const dto = req.body;
      
      // Basic Validation
      if (!dto.userId || !dto.ticketCategoryId || !dto.quantity || !dto.idempotencyKey) {
        return res.status(400).json({ message: 'Thiếu các thông tin bắt buộc (userId, ticketCategoryId, quantity, idempotencyKey)' });
      }

      const result = await this.createOrderUseCase.execute(dto);
      return res.status(201).json(result);
    } catch (err: any) {
      if (err.message === 'NOT_ENOUGH_TICKETS' || err.message === 'CONCURRENCY_CONFLICT_OR_OUT_OF_STOCK') {
        return res.status(409).json({ message: 'Vé đã hết hoặc đang có người khác nhanh tay hơn đặt trước. Vui lòng thử lại!' });
      }
      console.error(err);
      return res.status(500).json({ message: 'Lỗi hệ thống nội bộ', error: err.message });
    }
  }
}
