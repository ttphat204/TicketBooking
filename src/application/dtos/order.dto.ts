export interface CreateOrderDTO {
  userId: number;
  ticketCategoryId: number;
  quantity: number;
  voucherCode?: string;
  idempotencyKey: string;
}

export interface OrderResponseDTO {
  id: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  expiresAt: Date;
}
