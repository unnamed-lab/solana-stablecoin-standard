import { Test, TestingModule } from '@nestjs/testing';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { FeedType } from '@stbr/sss-token';

describe('QuotesController', () => {
  let controller: QuotesController;
  let service: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotesController],
      providers: [
        {
          provide: QuotesService,
          useValue: {
            simulateMintQuote: jest.fn().mockResolvedValue({ tokenAmount: 100 }),
            simulateRedeemQuote: jest.fn().mockResolvedValue({ usdAmount: 100 }),
          },
        },
      ],
    }).compile();

    controller = module.get<QuotesController>(QuotesController);
    service = module.get<QuotesService>(QuotesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should simulate mint quote', async () => {
    const dto = {
      usdCents: 10000,
      priceScaled: 5000000,
      feedType: FeedType.Direct,
      mintFeeBps: 30,
    };
    const result = await controller.simulateMintQuote(dto);
    expect(result).toEqual({ tokenAmount: 100 });
    expect(service.simulateMintQuote).toHaveBeenCalledWith(dto);
  });

  it('should simulate redeem quote', async () => {
    const dto = {
      tokenAmount: 1000000,
      priceScaled: 5000000,
      feedType: FeedType.Direct,
      redeemFeeBps: 30,
    };
    const result = await controller.simulateRedeemQuote(dto);
    expect(result).toEqual({ usdAmount: 100 });
    expect(service.simulateRedeemQuote).toHaveBeenCalledWith(dto);
  });
});
