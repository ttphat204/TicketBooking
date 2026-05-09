import { Concert, TicketCategory } from '../entities/concert.entity';

export interface IConcertRepository {
  findById(id: number): Promise<Concert | null>;
  findAll(): Promise<Concert[]>;
  findCategoryById(categoryId: number): Promise<TicketCategory | null>;
  
  updateAvailableQuantity(
    categoryId: number, 
    quantityChange: number, 
    expectedRowVersion: Buffer
  ): Promise<boolean>;
}
