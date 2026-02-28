import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { BlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';

describe('ComplianceController', () => {
    let controller: ComplianceController;
    let service: ComplianceService;

    const mockComplianceService = {
        blacklistAdd: jest.fn(),
        blacklistRemove: jest.fn(),
        getBlacklist: jest.fn(),
        isBlacklisted: jest.fn(),
        seize: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ComplianceController],
            providers: [
                {
                    provide: ComplianceService,
                    useValue: mockComplianceService,
                },
            ],
        }).compile();

        controller = module.get<ComplianceController>(ComplianceController);
        service = module.get<ComplianceService>(ComplianceService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('blacklistAdd', () => {
        it('should call complianceService.blacklistAdd and return the result', async () => {
            const dto: BlacklistDto = { address: 'addr1', reason: 'fraud', blacklisterKeypair: 'secret' };
            const expectedResult = { success: true, txSignature: 'tx_sig' };

            mockComplianceService.blacklistAdd.mockResolvedValue(expectedResult);

            const result = await controller.blacklistAdd(dto);

            expect(mockComplianceService.blacklistAdd).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('blacklistRemove', () => {
        it('should call complianceService.blacklistRemove and return the result', async () => {
            const address = 'addr1';
            const keypair = 'secret';
            const expectedResult = { success: true, txSignature: 'tx_sig' };

            mockComplianceService.blacklistRemove.mockResolvedValue(expectedResult);

            const result = await controller.blacklistRemove(address, keypair);

            expect(mockComplianceService.blacklistRemove).toHaveBeenCalledWith(address, keypair);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getBlacklist', () => {
        it('should call complianceService.getBlacklist without mint', async () => {
            const expectedResult = [{ address: 'addr1' }];

            mockComplianceService.getBlacklist.mockResolvedValue(expectedResult);

            const result = await controller.getBlacklist();

            expect(mockComplianceService.getBlacklist).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(expectedResult);
        });

        it('should call complianceService.getBlacklist with mint', async () => {
            const expectedResult = [{ address: 'addr1' }];

            mockComplianceService.getBlacklist.mockResolvedValue(expectedResult);

            const result = await controller.getBlacklist('mint1');

            expect(mockComplianceService.getBlacklist).toHaveBeenCalledWith('mint1');
            expect(result).toEqual(expectedResult);
        });
    });

    describe('isBlacklisted', () => {
        it('should call complianceService.isBlacklisted and return boolean object', async () => {
            const address = 'addr1';
            mockComplianceService.isBlacklisted.mockResolvedValue(true);

            const result = await controller.isBlacklisted(address);

            expect(mockComplianceService.isBlacklisted).toHaveBeenCalledWith(address, undefined);
            expect(result).toEqual({ blacklisted: true });
        });

        it('should pass query mint to service', async () => {
            const address = 'addr1';
            mockComplianceService.isBlacklisted.mockResolvedValue(false);

            const result = await controller.isBlacklisted(address, { mint: 'mint1' });

            expect(mockComplianceService.isBlacklisted).toHaveBeenCalledWith(address, 'mint1');
            expect(result).toEqual({ blacklisted: false });
        });
    });

    describe('seize', () => {
        it('should call complianceService.seize and return the result', async () => {
            const dto: SeizeDto = { amount: 100, from: 'f', to: 't', reason: 'r', seizerKeypair: 's' };
            const expectedResult = { success: true, txSignature: 'tx_sig' };

            mockComplianceService.seize.mockResolvedValue(expectedResult);

            const result = await controller.seize(dto);

            expect(mockComplianceService.seize).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });
});
