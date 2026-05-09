import { sql, poolPromise } from '../database/mssql';
import { Order } from '../../domain/entities/order.entity';
import { IOrderRepository } from '../../domain/repositories/order.repository';

export class OrderRepository implements IOrderRepository {
  async create(order: Order): Promise<Order> {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      
      await transaction.request()
        .input('id', sql.UniqueIdentifier, order.id)
        .input('userId', sql.Int, order.userId)
        .input('totalAmount', sql.Decimal(18, 2), order.totalAmount)
        .input('discountAmount', sql.Decimal(18, 2), order.discountAmount)
        .input('voucherId', sql.Int, order.voucherId || null)
        .input('status', sql.NVarChar(20), order.status)
        .input('idempotencyKey', sql.VarChar(255), order.idempotencyKey)
        .input('expiresAt', sql.DateTime, order.expiresAt)
        .query(`
          INSERT INTO Orders (Id, UserId, TotalAmount, DiscountAmount, VoucherId, Status, IdempotencyKey, ExpiresAt)
          VALUES (@id, @userId, @totalAmount, @discountAmount, @voucherId, @status, @idempotencyKey, @expiresAt)
        `);

      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          await transaction.request()
            .input('orderId', sql.UniqueIdentifier, order.id)
            .input('ticketCategoryId', sql.Int, item.ticketCategoryId)
            .input('quantity', sql.Int, item.quantity)
            .input('priceAtBooking', sql.Decimal(18, 2), item.priceAtBooking)
            .query(`
              INSERT INTO OrderItems (OrderId, TicketCategoryId, Quantity, PriceAtBooking)
              VALUES (@orderId, @ticketCategoryId, @quantity, @priceAtBooking)
            `);
        }
      }

      await transaction.commit();
      return order;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async findById(id: string): Promise<Order | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query(`
        SELECT * FROM Orders WHERE Id = @id;
        SELECT * FROM OrderItems WHERE OrderId = @id;
      `);

    if (result.recordset.length === 0) return null;

    const recordsets = result.recordsets as any[];
    const order = recordsets[0][0];
    const items = recordsets[1];

    return {
      id: order.Id,
      userId: order.UserId,
      totalAmount: order.TotalAmount,
      discountAmount: order.DiscountAmount,
      voucherId: order.VoucherId,
      status: order.Status,
      idempotencyKey: order.IdempotencyKey,
      expiresAt: order.ExpiresAt,
      createdAt: order.CreatedAt,
      items: items.map((i: any) => ({
        id: i.Id,
        orderId: i.OrderId,
        ticketCategoryId: i.TicketCategoryId,
        quantity: i.Quantity,
        priceAtBooking: i.PriceAtBooking
      }))
    };
  }

  async findByUserId(userId: number): Promise<Order[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM Orders WHERE UserId = @userId');
    
    return result.recordset.map((row: any) => ({
      id: row.Id,
      userId: row.UserId,
      totalAmount: row.TotalAmount,
      discountAmount: row.DiscountAmount,
      status: row.Status,
      idempotencyKey: row.IdempotencyKey,
      expiresAt: row.ExpiresAt,
      createdAt: row.CreatedAt
    }));
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('key', sql.VarChar(255), key)
      .query('SELECT * FROM Orders WHERE IdempotencyKey = @key');

    if (result.recordset.length === 0) return null;
    return this.findById(result.recordset[0].Id);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('status', sql.NVarChar(20), status)
      .query('UPDATE Orders SET Status = @status WHERE Id = @id');
  }

  async findExpiredOrders(): Promise<Order[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .query("SELECT * FROM Orders WHERE Status = 'Pending' AND ExpiresAt < GETUTCDATE()");
    
    return result.recordset.map((row: any) => ({
      id: row.Id,
      userId: row.UserId,
      totalAmount: row.TotalAmount,
      discountAmount: row.DiscountAmount,
      status: row.Status,
      idempotencyKey: row.IdempotencyKey,
      expiresAt: row.ExpiresAt,
      createdAt: row.CreatedAt
    }));
  }

  async cancelOrderWithCompensation(orderId: string): Promise<void> {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // 1. Get Order Items to know what to compensate
      const itemsResult = await transaction.request()
        .input('orderId', sql.UniqueIdentifier, orderId)
        .query('SELECT TicketCategoryId, Quantity FROM OrderItems WHERE OrderId = @orderId');

      // 2. Update Order Status
      await transaction.request()
        .input('orderId', sql.UniqueIdentifier, orderId)
        .query("UPDATE Orders SET Status = 'Expired' WHERE Id = @orderId AND Status = 'Pending'");

      // 3. Compensate stock
      for (const item of itemsResult.recordset) {
        await transaction.request()
          .input('categoryId', sql.Int, item.TicketCategoryId)
          .input('quantity', sql.Int, item.Quantity)
          .query('UPDATE TicketCategories SET AvailableQuantity = AvailableQuantity + @quantity WHERE Id = @categoryId');
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
