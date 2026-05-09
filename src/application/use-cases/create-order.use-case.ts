import { IOrderRepository } from '../../domain/repositories/order.repository';
import { IConcertRepository } from '../../domain/repositories/concert.repository';
import { IVoucherRepository } from '../../domain/repositories/voucher.repository';
import { CreateOrderDTO, OrderResponseDTO } from '../dtos/order.dto';
import { Order } from '../../domain/entities/order.entity';
import crypto from 'crypto';

export class CreateOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private concertRepo: IConcertRepository,
    private voucherRepo: IVoucherRepository
  ) {}

  async execute(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    const existingOrder = await this.orderRepo.findByIdempotencyKey(dto.idempotencyKey);
    if (existingOrder) {
      return this.mapToResponse(existingOrder);
    }

    const category = await this.concertRepo.findCategoryById(dto.ticketCategoryId);
    if (!category) throw new Error('Ticket category not found');
    if (category.availableQuantity < dto.quantity) {
      throw new Error('NOT_ENOUGH_TICKETS');
    }

    let discountAmount = 0;
    let voucherId: number | null = null;
    
    if (dto.voucherCode) {
      const voucher = await this.voucherRepo.findByCode(dto.voucherCode);
      const subtotal = category.price * dto.quantity;
      
      if (voucher && 
          voucher.expiryDate > new Date() && 
          voucher.currentUsage < voucher.maxUsage &&
          subtotal >= voucher.minOrderAmount) {
        
        voucherId = voucher.id;
        discountAmount = voucher.discountAmount; // In schema it's fixed amount
        
        // Ensure discount doesn't exceed total
        if (discountAmount > subtotal) discountAmount = subtotal;
      }
    }

    const totalAmount = (category.price * dto.quantity) - discountAmount;

    const success = await this.concertRepo.updateAvailableQuantity(
      dto.ticketCategoryId,
      -dto.quantity,
      category.rowVersion!
    );

    if (!success) {
      throw new Error('CONCURRENCY_CONFLICT_OR_OUT_OF_STOCK');
    }

    const orderId = crypto.randomUUID();
    const order: Order = {
      id: orderId,
      userId: dto.userId,
      totalAmount,
      discountAmount,
      voucherId,
      status: 'Pending',
      idempotencyKey: dto.idempotencyKey,
      expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 minutes
      createdAt: new Date(),
      items: [{
        id: 0, // Identity in DB
        orderId: orderId,
        ticketCategoryId: dto.ticketCategoryId,
        quantity: dto.quantity,
        priceAtBooking: category.price
      }]
    };

    try {
      const savedOrder = await this.orderRepo.create(order);
      
      if (voucherId) {
        await this.voucherRepo.incrementUsedCount(voucherId);
      }

      return this.mapToResponse(savedOrder);
    } catch (err) {
      // Basic compensation
      await this.concertRepo.updateAvailableQuantity(dto.ticketCategoryId, dto.quantity, Buffer.alloc(0));
      throw err;
    }
  }

  private mapToResponse(order: Order): OrderResponseDTO {
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      expiresAt: order.expiresAt
    };
  }
}
