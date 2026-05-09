export interface Voucher {
  id: number;
  code: string;
  discountAmount: number;
  minOrderAmount: number;
  maxUsage: number;
  currentUsage: number;
  isActive: boolean;
  expiryDate: Date;
}
