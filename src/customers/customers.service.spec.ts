import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const dto = { name: 'Acme', email: 'acme@ex.com', phone: '123' };
      mockPrismaService.customer.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(prisma.customer.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual({ id: 1, ...dto });
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const query = { page: 1, limit: 10 };
      const customers = [{ id: 1, name: 'Customer A' }];
      mockPrismaService.customer.findMany.mockResolvedValue(customers);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(prisma.customer.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        page: 1,
        limit: 10,
        totalRecords: 1,
        totalPages: 1,
        data: customers,
      });
    });

    it('should apply limit clamping', async () => {
      const query = { page: 1, limit: 500 };
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      const result = await service.findAll(query);

      expect(result.limit).toBe(100);
    });
  });

  describe('findOne', () => {
    it('should return a customer if it exists', async () => {
      const customer = { id: 1, name: 'Acme' };
      mockPrismaService.customer.findUnique.mockResolvedValue(customer);

      const result = await service.findOne(1);
      expect(result).toEqual(customer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer if it exists', async () => {
      const updateDto = { name: 'Acme 2' };
      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.customer.update.mockResolvedValue({ id: 1, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(prisma.customer.update).toHaveBeenCalled();
      expect(result.name).toBe('Acme 2');
    });
  });

  describe('remove', () => {
    it('should delete a customer if it exists', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.customer.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);
      expect(prisma.customer.delete).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });
});
