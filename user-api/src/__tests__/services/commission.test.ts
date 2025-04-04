import { CommissionService } from '../../services/commission';
import { User } from '../../models';
import { cacheService } from '../../services/cache';

jest.mock('../../models');
jest.mock('../../services/cache');

describe('CommissionService', () => {
  let commissionService: CommissionService;

  beforeEach(() => {
    commissionService = new CommissionService();
    jest.clearAllMocks();
  });

  describe('calculateCommission', () => {
    it('should calculate first level commission correctly', async () => {
      const orderAmount = 1000;
      const commissionRate = 0.1;
      const expectedCommission = orderAmount * commissionRate;

      const result = await commissionService.calculateCommission(orderAmount, 1);
      expect(result).toBe(expectedCommission);
    });

    it('should calculate second level commission correctly', async () => {
      const orderAmount = 1000;
      const commissionRate = 0.05;
      const expectedCommission = orderAmount * commissionRate;

      const result = await commissionService.calculateCommission(orderAmount, 2);
      expect(result).toBe(expectedCommission);
    });

    it('should return 0 for invalid level', async () => {
      const orderAmount = 1000;
      const result = await commissionService.calculateCommission(orderAmount, 3);
      expect(result).toBe(0);
    });
  });

  describe('distributeCommission', () => {
    it('should distribute commission to referrers', async () => {
      const orderId = 'order123';
      const userId = 'user123';
      const orderAmount = 1000;

      const mockUser = {
        id: userId,
        referredBy: 'referrer123',
        save: jest.fn(),
      };

      const mockReferrer = {
        id: 'referrer123',
        referredBy: 'referrer456',
        balance: 0,
        save: jest.fn(),
      };

      const mockSecondReferrer = {
        id: 'referrer456',
        balance: 0,
        save: jest.fn(),
      };

      (User.findById as jest.Mock).mockImplementation((id) => {
        if (id === userId) return mockUser;
        if (id === 'referrer123') return mockReferrer;
        if (id === 'referrer456') return mockSecondReferrer;
        return null;
      });

      await commissionService.distributeCommission(orderId, userId, orderAmount);

      expect(mockReferrer.balance).toBe(100); // 10% of 1000
      expect(mockSecondReferrer.balance).toBe(50); // 5% of 1000
      expect(mockReferrer.save).toHaveBeenCalled();
      expect(mockSecondReferrer.save).toHaveBeenCalled();
    });

    it('should handle users without referrers', async () => {
      const orderId = 'order123';
      const userId = 'user123';
      const orderAmount = 1000;

      const mockUser = {
        id: userId,
        referredBy: null,
        save: jest.fn(),
      };

      (User.findById as jest.Mock).mockReturnValue(mockUser);

      await commissionService.distributeCommission(orderId, userId, orderAmount);

      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('getUserCommissions', () => {
    it('should return user commissions from cache if available', async () => {
      const userId = 'user123';
      const mockCommissions = [
        { id: 'comm1', amount: 100 },
        { id: 'comm2', amount: 200 },
      ];

      (cacheService.getCommission as jest.Mock).mockResolvedValue(mockCommissions);

      const result = await commissionService.getUserCommissions(userId);
      expect(result).toEqual(mockCommissions);
    });

    it('should fetch and cache user commissions if not in cache', async () => {
      const userId = 'user123';
      const mockCommissions = [
        { id: 'comm1', amount: 100 },
        { id: 'comm2', amount: 200 },
      ];

      (cacheService.getCommission as jest.Mock).mockResolvedValue(null);
      (Commission.find as jest.Mock).mockResolvedValue(mockCommissions);

      const result = await commissionService.getUserCommissions(userId);
      expect(result).toEqual(mockCommissions);
      expect(cacheService.setCommission).toHaveBeenCalledWith(userId, mockCommissions);
    });
  });
}); 