import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '@app/database';
import { SdkService } from '@app/blockchain';
import { PublicKey, Keypair } from '@solana/web3.js';
import { BlacklistDto } from './dto/blacklist.dto';
import { SeizeDto } from './dto/seize.dto';

describe('ComplianceService', () => {
    let service: ComplianceService;
    let prismaService: PrismaService;
    let sdkService: SdkService;

    const mockPrismaService = {
        blacklistEntry: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    const mockSdk = {
        compliance: {
            blacklistAdd: jest.fn(),
            blacklistRemove: jest.fn(),
            seize: jest.fn(),
            isBlacklisted: jest.fn(),
        },
    };

    const mockSdkService = {
        getSdk: jest.fn().mockResolvedValue(mockSdk),
        decodeKeypair: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ComplianceService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: SdkService, useValue: mockSdkService },
            ],
        }).compile();

        service = module.get<ComplianceService>(ComplianceService);
        prismaService = module.get<PrismaService>(PrismaService);
        sdkService = module.get<SdkService>(SdkService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('blacklistAdd', () => {
        it('should call sdk.compliance.blacklistAdd', async () => {
            const dto: BlacklistDto = { address: '22222222222222222222222222222222222222222222', reason: 'r', blacklisterKeypair: 's' };
            const authorityKeyPair = Keypair.generate();

            mockSdkService.decodeKeypair.mockReturnValue(authorityKeyPair);
            mockSdk.compliance.blacklistAdd.mockResolvedValue('tx_sig');

            const result = await service.blacklistAdd(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('s');
            expect(mockSdk.compliance.blacklistAdd).toHaveBeenCalledWith(authorityKeyPair, {
                address: new PublicKey(dto.address),
                reason: dto.reason,
            });
            expect(result).toEqual({ success: true, txSignature: 'tx_sig' });
        });
    });

    describe('blacklistRemove', () => {
        it('should call sdk.compliance.blacklistRemove', async () => {
            const authorityKeyPair = Keypair.generate();

            mockSdkService.decodeKeypair.mockReturnValue(authorityKeyPair);
            mockSdk.compliance.blacklistRemove.mockResolvedValue('tx_sig');

            const result = await service.blacklistRemove('22222222222222222222222222222222222222222222', 's');

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('s');
            expect(mockSdk.compliance.blacklistRemove).toHaveBeenCalledWith(authorityKeyPair, new PublicKey('22222222222222222222222222222222222222222222'));
            expect(result).toEqual({ success: true, txSignature: 'tx_sig' });
        });
    });

    describe('seize', () => {
        it('should call sdk.compliance.seize', async () => {
            const dto: SeizeDto = { amount: 100, from: '22222222222222222222222222222222222222222222', to: '33333333333333333333333333333333333333333333', reason: 'r', seizerKeypair: 's' };
            const authorityKeyPair = Keypair.generate();

            mockSdkService.decodeKeypair.mockReturnValue(authorityKeyPair);
            mockSdk.compliance.seize.mockResolvedValue('tx_sig');

            const result = await service.seize(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('s');
            expect(mockSdk.compliance.seize).toHaveBeenCalledWith(
                authorityKeyPair,
                new PublicKey(dto.from),
                new PublicKey(dto.to),
                dto.amount,
                dto.reason
            );
            expect(result).toEqual({ success: true, txSignature: 'tx_sig' });
        });
    });

    describe('getBlacklist', () => {
        it('should return blacklist from db', async () => {
            const mockResult = [{ address: 'addr1' }];
            mockPrismaService.blacklistEntry.findMany.mockResolvedValue(mockResult);

            const result = await service.getBlacklist();

            expect(mockPrismaService.blacklistEntry.findMany).toHaveBeenCalledWith({
                where: { removed: false },
                orderBy: { indexedAt: 'desc' },
            });
            expect(result).toEqual(mockResult);
        });

        it('should return blacklist from db filtered by mint', async () => {
            const mockResult = [{ address: 'addr1' }];
            mockPrismaService.blacklistEntry.findMany.mockResolvedValue(mockResult);

            const result = await service.getBlacklist('mint1');

            expect(mockPrismaService.blacklistEntry.findMany).toHaveBeenCalledWith({
                where: { removed: false, mint: 'mint1' },
                orderBy: { indexedAt: 'desc' },
            });
            expect(result).toEqual(mockResult);
        });
    });

    describe('isBlacklisted', () => {
        it('should return true if blacklisted on-chain', async () => {
            mockSdk.compliance.isBlacklisted.mockResolvedValue(true);

            const result = await service.isBlacklisted('22222222222222222222222222222222222222222222');

            expect(mockSdk.compliance.isBlacklisted).toHaveBeenCalledWith(new PublicKey('22222222222222222222222222222222222222222222'));
            expect(result).toBe(true);
        });

        it('should return boolean from db if SDK call throws', async () => {
            mockSdk.compliance.isBlacklisted.mockRejectedValue(new Error('SDK Error'));
            mockPrismaService.blacklistEntry.findFirst.mockResolvedValue({ address: '22222222222222222222222222222222222222222222' });

            const result = await service.isBlacklisted('22222222222222222222222222222222222222222222');

            expect(mockSdk.compliance.isBlacklisted).toHaveBeenCalled();
            expect(mockPrismaService.blacklistEntry.findFirst).toHaveBeenCalledWith({
                where: { address: '22222222222222222222222222222222222222222222', removed: false },
            });
            expect(result).toBe(true);
        });

        it('should return false from db if SDK call throws and not in db', async () => {
            mockSdk.compliance.isBlacklisted.mockRejectedValue(new Error('SDK Error'));
            mockPrismaService.blacklistEntry.findFirst.mockResolvedValue(null);

            const result = await service.isBlacklisted('22222222222222222222222222222222222222222222');

            expect(mockSdk.compliance.isBlacklisted).toHaveBeenCalled();
            expect(mockPrismaService.blacklistEntry.findFirst).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });
});
