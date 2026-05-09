import { sql, poolPromise } from '../database/mssql';
import { Voucher } from '../../domain/entities/voucher.entity';
import { IVoucherRepository } from '../../domain/repositories/voucher.repository';

export class VoucherRepository implements IVoucherRepository {
  async findByCode(code: string): Promise<Voucher | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('code', sql.VarChar(50), code)
      .query('SELECT * FROM Vouchers WHERE Code = @code AND IsActive = 1');

    if (result.recordset.length === 0) return null;
    const v = result.recordset[0];

    return {
      id: v.Id,
      code: v.Code,
      discountAmount: v.DiscountAmount,
      minOrderAmount: v.MinOrderAmount,
      maxUsage: v.MaxUsage,
      currentUsage: v.CurrentUsage,
      isActive: v.IsActive,
      expiryDate: v.ExpiryDate
    };
  }

  async incrementUsedCount(id: number): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Vouchers SET CurrentUsage = CurrentUsage + 1 WHERE Id = @id');
  }
}
