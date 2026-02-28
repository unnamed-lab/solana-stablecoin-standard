import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '@app/database';

jest.mock('@app/shared', () => ({
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200,
}));

describe('AuditService', () => {
    let service: AuditService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        auditLog: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAuditLog', () => {
        it('should return paginated audit logs', async () => {
            const mockData = [{ id: 1, action: 'MINT' }];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockData);
            mockPrismaService.auditLog.count.mockResolvedValue(100);

            const result = await service.getAuditLog({ page: 2, pageSize: 20 });

            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: 'desc' },
                skip: 20,
                take: 20,
            });
            expect(mockPrismaService.auditLog.count).toHaveBeenCalledWith({ where: {} });
            expect(result).toEqual({
                data: mockData,
                pagination: {
                    page: 2,
                    pageSize: 20,
                    total: 100,
                    totalPages: 5,
                },
            });
        });

        it('should map filters properly and clamp max page size', async () => {
            const mockData = [{ id: 1, action: 'MINT' }];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockData);
            mockPrismaService.auditLog.count.mockResolvedValue(5);

            const result = await service.getAuditLog({
                mint: 'mint1',
                action: 'MINT',
                actor: 'user1',
                page: 0,
                pageSize: 500, // clamped to 200
            });

            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { mint: 'mint1', action: 'MINT', actor: 'user1' },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 200,
            });
            expect(result.pagination.pageSize).toBe(200);
            expect(result.pagination.page).toBe(1);
        });
    });

    describe('exportCsv', () => {
        it('should format data to CSV properly', async () => {
            const date1 = new Date('2023-01-01T00:00:00Z');
            const mockData = [
                { id: 1, mint: 'mint1', action: 'MINT', actor: 'actor1', target: 'target1', amount: BigInt(100), reason: 'a "reason", test\nnew line', txSignature: 'sig1', createdAt: date1 },
            ];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockData);

            const result = await service.exportCsv({ mint: 'mint1' });

            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: { mint: 'mint1' },
                orderBy: { createdAt: 'desc' },
            });

            const expectedCsv = `id,mint,action,actor,target,amount,reason,txSignature,createdAt\n1,mint1,MINT,actor1,target1,100,"a ""reason"", test\nnew line",sig1,2023-01-01T00:00:00.000Z`;
            expect(result).toBe(expectedCsv);
        });

        it('should handle null/undefined fields for CSV formatting', async () => {
            const date1 = new Date('2023-01-01T00:00:00Z');
            const mockData = [
                { id: 2, mint: 'mint2', action: 'BURN', actor: 'actor2', txSignature: 'sig2', createdAt: date1 },
            ];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockData);

            const result = await service.exportCsv({});

            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { createdAt: 'desc' },
            });

            const expectedCsv = `id,mint,action,actor,target,amount,reason,txSignature,createdAt\n2,mint2,BURN,actor2,,,,sig2,2023-01-01T00:00:00.000Z`;
            expect(result).toBe(expectedCsv);
        });
    });
});
