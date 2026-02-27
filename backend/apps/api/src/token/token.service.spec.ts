import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { BlockchainService, SdkService } from '@app/blockchain';
import { PrismaService } from '@app/database';
import { PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';

// Mock getAssociatedTokenAddressSync
jest.mock('@solana/spl-token', () => {
    const { PublicKey } = require('@solana/web3.js');
    return {
        getAssociatedTokenAddressSync: jest.fn().mockReturnValue(new PublicKey('11111111111111111111111111111111')), // Dummy Pubkey
        createAssociatedTokenAccountInstruction: jest.fn().mockReturnValue({ keys: [], programId: new PublicKey('11111111111111111111111111111111'), data: Buffer.from([]) }),
        TOKEN_2022_PROGRAM_ID: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
    };
});

describe('TokenService', () => {
    let service: TokenService;
    let blockchainService: BlockchainService;
    let sdkService: SdkService;
    let prismaService: PrismaService;

    const mockConnection = {
        getAccountInfo: jest.fn(),
        getLatestBlockhash: jest.fn(),
        sendRawTransaction: jest.fn(),
        confirmTransaction: jest.fn(),
    };

    const mockBlockchainService = {
        getConnection: jest.fn().mockReturnValue(mockConnection),
        getTotalSupply: jest.fn(),
    };

    const mockSdk = {
        mintAddress: new PublicKey('So11111111111111111111111111111111111111112'), // Dummy WRAPPED SOL mint address
        mint: jest.fn(),
        burn: jest.fn(),
        getMaxSupply: jest.fn(),
        getHoldersCount: jest.fn(),
        getLargestHolders: jest.fn(),
    };

    const mockSdkService = {
        getSdk: jest.fn().mockResolvedValue(mockSdk),
        decodeKeypair: jest.fn(),
    };

    const mockPrismaService = {
        burnEvent: {
            aggregate: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.spyOn(Transaction.prototype, 'sign').mockImplementation(() => { });
        jest.spyOn(Transaction.prototype, 'serialize').mockReturnValue(Buffer.from('mock_tx'));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: BlockchainService, useValue: mockBlockchainService },
                { provide: SdkService, useValue: mockSdkService },
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
        blockchainService = module.get<BlockchainService>(BlockchainService);
        sdkService = module.get<SdkService>(SdkService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('mint', () => {
        it('should create ATA if it does not exist and perform mint', async () => {
            const minterKeypair = Keypair.generate();
            mockSdkService.decodeKeypair.mockReturnValue(minterKeypair);

            mockConnection.getAccountInfo.mockResolvedValue(null); // ATA does not exist
            mockConnection.getLatestBlockhash.mockResolvedValue({ blockhash: 'hash', lastValidBlockHeight: 1 });
            mockConnection.sendRawTransaction.mockResolvedValue('ata_sig');
            mockConnection.confirmTransaction.mockResolvedValue(true);

            mockSdk.mint.mockResolvedValue('mint_sig');

            const dto: MintDto = { amount: 100, recipient: '22222222222222222222222222222222222222222222', minterKeypair: 'secret' };
            const result = await service.mint(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('secret');
            expect(mockConnection.getAccountInfo).toHaveBeenCalled();
            expect(mockConnection.sendRawTransaction).toHaveBeenCalled();
            expect(mockSdk.mint).toHaveBeenCalled();
            expect(result).toEqual({ success: true, txSignature: 'mint_sig' });
        });

        it('should skip ATA creation if it exists and perform mint', async () => {
            const minterKeypair = Keypair.generate();
            mockSdkService.decodeKeypair.mockReturnValue(minterKeypair);

            mockConnection.getAccountInfo.mockResolvedValue({ data: Buffer.from([]) }); // ATA exists

            mockSdk.mint.mockResolvedValue('mint_sig_2');

            const dto: MintDto = { amount: 100, recipient: '22222222222222222222222222222222222222222222', minterKeypair: 'secret' };
            const result = await service.mint(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('secret');
            expect(mockConnection.getAccountInfo).toHaveBeenCalled();
            expect(mockConnection.sendRawTransaction).not.toHaveBeenCalled(); // ATA not created
            expect(mockSdk.mint).toHaveBeenCalled();
            expect(result).toEqual({ success: true, txSignature: 'mint_sig_2' });
        });
    });

    describe('burn', () => {
        it('should perform burn', async () => {
            const burnerKeypair = Keypair.generate();
            mockSdkService.decodeKeypair.mockReturnValue(burnerKeypair);
            mockSdk.burn.mockResolvedValue('burn_sig');

            const dto: BurnDto = { amount: 50, burnerKeypair: 'secret' };
            const result = await service.burn(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('secret');
            expect(mockSdk.burn).toHaveBeenCalled();
            expect(result).toEqual({ success: true, txSignature: 'burn_sig' });
        });

        it('should perform burn from specific source', async () => {
            const burnerKeypair = Keypair.generate();
            mockSdkService.decodeKeypair.mockReturnValue(burnerKeypair);
            mockSdk.burn.mockResolvedValue('burn_sig_source');

            const dto: BurnDto = { amount: 50, burnerKeypair: 'secret', source: '22222222222222222222222222222222222222222222' };
            const result = await service.burn(dto);

            expect(mockSdkService.decodeKeypair).toHaveBeenCalledWith('secret');
            expect(mockSdk.burn).toHaveBeenCalled();
            expect(result).toEqual({ success: true, txSignature: 'burn_sig_source' });
        });
    });

    describe('getSupply', () => {
        it('should return supply info', async () => {
            mockBlockchainService.getTotalSupply.mockResolvedValue({ totalSupply: '1000', decimals: 6 });
            mockSdk.getMaxSupply.mockResolvedValue(BigInt(5000));
            mockPrismaService.burnEvent.aggregate.mockResolvedValue({ _sum: { amount: BigInt(200) } });

            const result = await service.getSupply();

            expect(mockBlockchainService.getTotalSupply).toHaveBeenCalled();
            expect(mockSdk.getMaxSupply).toHaveBeenCalled();
            expect(mockPrismaService.burnEvent.aggregate).toHaveBeenCalled();
            expect(result).toEqual({
                totalSupply: '1000',
                maxSupply: '5000',
                burnSupply: '200',
                decimals: 6,
            });
        });

        it('should handle null maxSupply and empty burnSupply', async () => {
            mockBlockchainService.getTotalSupply.mockResolvedValue({ totalSupply: '1000', decimals: 6 });
            mockSdk.getMaxSupply.mockResolvedValue(null);
            mockPrismaService.burnEvent.aggregate.mockResolvedValue({ _sum: { amount: null } });

            const result = await service.getSupply();

            expect(result).toEqual({
                totalSupply: '1000',
                maxSupply: null,
                burnSupply: '0',
                decimals: 6,
            });
        });
    });

    describe('getHoldersCount', () => {
        it('should return holders count', async () => {
            mockSdk.getHoldersCount.mockResolvedValue(42);

            const result = await service.getHoldersCount();

            expect(mockSdk.getHoldersCount).toHaveBeenCalled();
            expect(result).toEqual({ count: 42 });
        });
    });

    describe('getLargestHolders', () => {
        it('should return largest holders formatted', async () => {
            mockSdk.getLargestHolders.mockResolvedValue([
                { address: new PublicKey('11111111111111111111111111111111'), amount: '100', decimals: 6, uiAmount: 100, uiAmountString: '100' }
            ]);

            const result = await service.getLargestHolders(10);

            expect(mockSdk.getLargestHolders).toHaveBeenCalledWith(10);
            expect(result).toEqual([
                { address: '11111111111111111111111111111111', amount: '100', decimals: 6, uiAmount: 100, uiAmountString: '100' }
            ]);
        });
    });
});
