import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

describe('AuditController', () => {
    let controller: AuditController;
    let service: AuditService;

    const mockAuditService = {
        getAuditLog: jest.fn(),
        exportCsv: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuditController],
            providers: [
                {
                    provide: AuditService,
                    useValue: mockAuditService,
                },
            ],
        }).compile();

        controller = module.get<AuditController>(AuditController);
        service = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getAuditLog', () => {
        it('should call auditService.getAuditLog and return the result', async () => {
            const expectedResult = { data: [], pagination: {} };
            mockAuditService.getAuditLog.mockResolvedValue(expectedResult);

            const result = await controller.getAuditLog('mint1', 'MINT', 'actor1', '2', '20');

            expect(mockAuditService.getAuditLog).toHaveBeenCalledWith({
                mint: 'mint1',
                action: 'MINT',
                actor: 'actor1',
                page: 2,
                pageSize: 20,
            });
            expect(result).toEqual(expectedResult);
        });

        it('should parse no arguments as undefined', async () => {
            const expectedResult = { data: [], pagination: {} };
            mockAuditService.getAuditLog.mockResolvedValue(expectedResult);

            const result = await controller.getAuditLog();

            expect(mockAuditService.getAuditLog).toHaveBeenCalledWith({
                mint: undefined,
                action: undefined,
                actor: undefined,
                page: undefined,
                pageSize: undefined,
            });
            expect(result).toEqual(expectedResult);
        });
    });

    describe('exportCsv', () => {
        it('should call auditService.exportCsv and return the result', async () => {
            const expectedResult = 'csv,data\nrow1,data1';
            mockAuditService.exportCsv.mockResolvedValue(expectedResult);

            const result = await controller.exportCsv('mint1', 'MINT');

            expect(mockAuditService.exportCsv).toHaveBeenCalledWith({ mint: 'mint1', action: 'MINT' });
            expect(result).toEqual(expectedResult);
        });
    });
});
