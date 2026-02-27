import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

describe('TokenController', () => {
    let controller: TokenController;
    let service: TokenService;

    const mockTokenService = {
        mint: jest.fn(),
        burn: jest.fn(),
        getSupply: jest.fn(),
        getHoldersCount: jest.fn(),
        getLargestHolders: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TokenController],
            providers: [
                {
                    provide: TokenService,
                    useValue: mockTokenService,
                },
            ],
        }).compile();

        controller = module.get<TokenController>(TokenController);
        service = module.get<TokenService>(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('mint', () => {
        it('should call tokenService.mint and return the result', async () => {
            const dto: MintDto = { amount: 100, recipient: 'recipient_address', minterKeypair: 'secret' };
            const expectedResult = { success: true, txSignature: 'tx_sig_123' };

            mockTokenService.mint.mockResolvedValue(expectedResult);

            const result = await controller.mint(dto);

            expect(mockTokenService.mint).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('burn', () => {
        it('should call tokenService.burn and return the result', async () => {
            const dto: BurnDto = { amount: 50, burnerKeypair: 'secret' };
            const expectedResult = { success: true, txSignature: 'tx_sig_456' };

            mockTokenService.burn.mockResolvedValue(expectedResult);

            const result = await controller.burn(dto);

            expect(mockTokenService.burn).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getSupply', () => {
        it('should call tokenService.getSupply and return the result', async () => {
            const expectedResult = { totalSupply: '1000', maxSupply: null, burnSupply: '0', decimals: 6 };

            mockTokenService.getSupply.mockResolvedValue(expectedResult);

            const result = await controller.getSupply();

            expect(mockTokenService.getSupply).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getHoldersCount', () => {
        it('should call tokenService.getHoldersCount and return the result', async () => {
            const expectedResult = { count: 10 };

            mockTokenService.getHoldersCount.mockResolvedValue(expectedResult);

            const result = await controller.getHoldersCount();

            expect(mockTokenService.getHoldersCount).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });
    });

    describe('getLargestHolders', () => {
        it('should call tokenService.getLargestHolders and return the result without minAmount', async () => {
            const expectedResult = [{ address: 'addr1', amount: '100', decimals: 6, uiAmount: 100, uiAmountString: '100' }];

            mockTokenService.getLargestHolders.mockResolvedValue(expectedResult);

            const result = await controller.getLargestHolders();

            expect(mockTokenService.getLargestHolders).toHaveBeenCalledWith(undefined);
            expect(result).toEqual(expectedResult);
        });

        it('should call tokenService.getLargestHolders and return the result with minAmount', async () => {
            const expectedResult = [{ address: 'addr1', amount: '100', decimals: 6, uiAmount: 100, uiAmountString: '100' }];

            mockTokenService.getLargestHolders.mockResolvedValue(expectedResult);

            const result = await controller.getLargestHolders('50');

            expect(mockTokenService.getLargestHolders).toHaveBeenCalledWith(50);
            expect(result).toEqual(expectedResult);
        });
    });
});
