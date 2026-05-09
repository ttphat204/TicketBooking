import { Request, Response } from 'express';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order.use-case';
import { ConfirmOrderUseCase } from '../../../application/use-cases/confirm-order.use-case';
import { OrderRepository } from '../../../infrastructure/repositories/order.repository.impl';
import { ConcertRepository } from '../../../infrastructure/repositories/concert.repository.impl';
import { VoucherRepository } from '../../../infrastructure/repositories/voucher.repository.impl';

export class OrderController {
  private createOrderUseCase: CreateOrderUseCase;
  private confirmOrderUseCase: ConfirmOrderUseCase;
  private orderRepo: OrderRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    const concertRepo = new ConcertRepository();
    const voucherRepo = new VoucherRepository();
    this.createOrderUseCase = new CreateOrderUseCase(this.orderRepo, concertRepo, voucherRepo);
    this.confirmOrderUseCase = new ConfirmOrderUseCase(this.orderRepo);
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

  async getById(req: Request, res: Response) {
    try {
      const order = await this.orderRepo.findById(req.params.id as string);
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }
      return res.json(order);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi hệ thống nội bộ', error: err.message });
    }
  }

  async confirmPayment(req: Request, res: Response) {
    try {
      const result = await this.confirmOrderUseCase.execute(req.params.id as string);
      return res.json(result);
    } catch (err: any) {
      if (err.message === 'ORDER_NOT_FOUND') {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }
      if (err.message.startsWith('INVALID_STATUS')) {
        return res.status(400).json({ message: err.message.replace('INVALID_STATUS: ', '') });
      }
      if (err.message.startsWith('ORDER_EXPIRED')) {
        return res.status(410).json({ message: err.message.replace('ORDER_EXPIRED: ', '') });
      }
      if (err.message.startsWith('PAYMENT_FAILED')) {
        return res.status(402).json({ message: err.message.replace('PAYMENT_FAILED: ', '') });
      }
      console.error(err);
      return res.status(500).json({ message: 'Lỗi hệ thống nội bộ', error: err.message });
    }
  }
}
