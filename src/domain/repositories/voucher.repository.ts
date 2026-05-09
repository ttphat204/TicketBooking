import { Voucher } from '../entities/voucher.entity';

export interface IVoucherRepository {
  findByCode(code: string): Promise<Voucher | null>;
  incrementUsedCount(id: number): Promise<void>;
}
