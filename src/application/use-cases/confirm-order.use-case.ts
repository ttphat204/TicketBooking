import { IOrderRepository } from '../../domain/repositories/order.repository';
import { Order } from '../../domain/entities/order.entity';

export interface ConfirmOrderResponseDTO {
  id: string;
  status: string;
  totalAmount: number;
  message: string;
}

export class ConfirmOrderUseCase {
  constructor(private orderRepo: IOrderRepository) {}

  async execute(orderId: string): Promise<ConfirmOrderResponseDTO> {
    // 1. Tìm đơn hàng
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    // 2. Kiểm tra trạng thái hợp lệ — chỉ Pending mới được xác nhận
    if (order.status !== 'Pending') {
      throw new Error(`INVALID_STATUS: Đơn hàng đang ở trạng thái "${order.status}", không thể xác nhận.`);
    }

    // 3. Kiểm tra đơn hàng chưa hết hạn
    if (new Date() > new Date(order.expiresAt)) {
      throw new Error('ORDER_EXPIRED: Đơn hàng đã hết thời gian thanh toán.');
    }

    // 4. === MOCK PAYMENT GATEWAY ===
    // Trong thực tế, đây là nơi gọi đến cổng thanh toán (VNPay, Momo, Stripe...)
    // Giả lập: luôn trả về thành công
    const paymentSuccess = await this.mockPaymentGateway(order);

    if (!paymentSuccess) {
      throw new Error('PAYMENT_FAILED: Thanh toán thất bại. Vui lòng thử lại.');
    }

    // 5. Cập nhật trạng thái → Confirmed
    await this.orderRepo.updateStatus(orderId, 'Confirmed');

    return {
      id: order.id,
      status: 'Confirmed',
      totalAmount: order.totalAmount,
      message: `Thanh toán thành công! Đơn hàng ${order.id} đã được xác nhận.`
    };
  }

  /**
   * Mock Payment Gateway
   * Giả lập quá trình thanh toán - luôn trả về thành công.
   * Trong production, thay bằng tích hợp VNPay/Momo/Stripe SDK.
   */
  private async mockPaymentGateway(order: Order): Promise<boolean> {
    // Giả lập độ trễ mạng của cổng thanh toán (500ms - 1.5s)
    const delay = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    console.log(`[PaymentGateway] Processing payment for Order ${order.id} — Amount: ${order.totalAmount} VND`);
    console.log(`[PaymentGateway] Payment SUCCESS ✓`);

    return true; // Luôn thành công trong bản giả lập
  }
}
