import { CreateOrderUseCase } from '../../src/application/use-cases/create-order.use-case';
import { IOrderRepository } from '../../src/domain/repositories/order.repository';
import { IConcertRepository } from '../../src/domain/repositories/concert.repository';
import { IVoucherRepository } from '../../src/domain/repositories/voucher.repository';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;
  let mockConcertRepo: jest.Mocked<IConcertRepository>;
  let mockVoucherRepo: jest.Mocked<IVoucherRepository>;

  beforeEach(() => {
    mockOrderRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
    } as any;

    mockConcertRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findCategoryById: jest.fn(),
      updateAvailableQuantity: jest.fn(),
    } as any;

    mockVoucherRepo = {
      findByCode: jest.fn(),
      incrementUsedCount: jest.fn(),
    } as any;

    useCase = new CreateOrderUseCase(mockOrderRepo, mockConcertRepo, mockVoucherRepo);
  });

  it('should create an order successfully when stock is available', async () => {
    // Arrange
    const dto = {
      userId: 1,
      ticketCategoryId: 101,
      quantity: 2,
      idempotencyKey: 'key-123'
    };

    mockOrderRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockConcertRepo.findCategoryById.mockResolvedValue({
      id: 101,
      concertId: 1,
      name: 'VIP',
      price: 1000,
      totalQuantity: 100,
      availableQuantity: 50,
      rowVersion: Buffer.from([1, 2, 3])
    });
    mockConcertRepo.updateAvailableQuantity.mockResolvedValue(true);
    mockOrderRepo.create.mockImplementation(async (order) => order);

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.status).toBe('Pending');
    expect(result.totalAmount).toBe(2000);
    expect(mockConcertRepo.updateAvailableQuantity).toHaveBeenCalledWith(101, -2, expect.any(Buffer));
    expect(mockOrderRepo.create).toHaveBeenCalled();
  });

  it('should throw error when not enough tickets', async () => {
    // Arrange
    const dto = {
      userId: 1,
      ticketCategoryId: 101,
      quantity: 10,
      idempotencyKey: 'key-456'
    };

    mockOrderRepo.findByIdempotencyKey.mockResolvedValue(null);
    mockConcertRepo.findCategoryById.mockResolvedValue({
      id: 101,
      concertId: 1,
      name: 'VIP',
      price: 1000,
      totalQuantity: 100,
      availableQuantity: 5,
      rowVersion: Buffer.from([1, 2, 3])
    });

    // Act & Assert
    await expect(useCase.execute(dto)).rejects.toThrow('NOT_ENOUGH_TICKETS');
  });

  it('should return existing order if idempotency key exists', async () => {
    // Arrange
    const dto = {
      userId: 1,
      ticketCategoryId: 101,
      quantity: 2,
      idempotencyKey: 'key-duplicate'
    };

    const existingOrder = {
      id: 'existing-id',
      userId: 1,
      status: 'Pending',
      totalAmount: 2000,
      discountAmount: 0,
      expiresAt: new Date()
    } as any;

    mockOrderRepo.findByIdempotencyKey.mockResolvedValue(existingOrder);

    // Act
    const result = await useCase.execute(dto);

    // Assert
    expect(result.id).toBe('existing-id');
    expect(mockConcertRepo.findCategoryById).not.toHaveBeenCalled();
  });
});
