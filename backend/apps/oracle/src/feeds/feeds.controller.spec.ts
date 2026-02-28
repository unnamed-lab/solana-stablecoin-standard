import { Test, TestingModule } from '@nestjs/testing';
import { FeedsController } from './feeds.controller';
import { FeedsService } from './feeds.service';

describe('FeedsController', () => {
  let controller: FeedsController;
  let service: FeedsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedsController],
      providers: [
        {
          provide: FeedsService,
          useValue: {
            listFeeds: jest.fn().mockResolvedValue([]),
            registerFeed: jest.fn().mockResolvedValue({ success: true, txSig: 'mockSig' }),
          },
        },
      ],
    }).compile();

    controller = module.get<FeedsController>(FeedsController);
    service = module.get<FeedsService>(FeedsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list feeds', async () => {
    const result = await controller.listFeeds();
    expect(result).toEqual([]);
    expect(service.listFeeds).toHaveBeenCalled();
  });
});
