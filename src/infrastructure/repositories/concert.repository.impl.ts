import { sql, poolPromise } from '../database/mssql';
import { Concert, TicketCategory } from '../../domain/entities/concert.entity';
import { IConcertRepository } from '../../domain/repositories/concert.repository';

export class ConcertRepository implements IConcertRepository {
  async findById(id: number): Promise<Concert | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM Concerts WHERE Id = @id;
        SELECT * FROM TicketCategories WHERE ConcertId = @id;
      `);

    if (result.recordset.length === 0) return null;

    const recordsets = result.recordsets as any[];
    const concert = recordsets[0][0];
    const categories = recordsets[1];

    return {
      id: concert.Id,
      title: concert.Title,
      description: concert.Description,
      location: concert.Location,
      eventDate: concert.EventDate,
      createdAt: concert.CreatedAt,
      categories: categories.map((cat: any) => ({
        id: cat.Id,
        concertId: cat.ConcertId,
        name: cat.Name,
        price: cat.Price,
        totalQuantity: cat.TotalQuantity,
        availableQuantity: cat.AvailableQuantity,
        rowVersion: cat.RowVersion
      }))
    };
  }

  async findAll(): Promise<Concert[]> {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Concerts');
    return result.recordset.map((row: any) => ({
      id: row.Id,
      title: row.Title,
      description: row.Description,
      location: row.Location,
      eventDate: row.EventDate,
      createdAt: row.CreatedAt
    }));
  }

  async findCategoryById(categoryId: number): Promise<TicketCategory | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, categoryId)
      .query('SELECT * FROM TicketCategories WHERE Id = @id');

    if (result.recordset.length === 0) return null;
    const cat = result.recordset[0];

    return {
      id: cat.Id,
      concertId: cat.ConcertId,
      name: cat.Name,
      price: cat.Price,
      totalQuantity: cat.TotalQuantity,
      availableQuantity: cat.AvailableQuantity,
      rowVersion: cat.RowVersion
    };
  }

  async updateAvailableQuantity(
    categoryId: number, 
    quantityChange: number, 
    expectedRowVersion: Buffer
  ): Promise<boolean> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, categoryId)
      .input('change', sql.Int, quantityChange)
      .input('version', sql.VarBinary, expectedRowVersion)
      .query(`
        UPDATE TicketCategories 
        SET AvailableQuantity = AvailableQuantity + @change
        WHERE Id = @id AND RowVersion = @version AND (AvailableQuantity + @change) >= 0;
        
        SELECT @@ROWCOUNT as UpdatedRows;
      `);

    return result.recordset[0].UpdatedRows > 0;
  }
}
