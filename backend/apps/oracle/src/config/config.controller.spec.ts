import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

describe('ConfigController', () => {
  let controller: ConfigController;
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getOracleInfo: jest.fn().mockResolvedValue({}),
            initializeOracle: jest.fn().mockResolvedValue({ success: true, txSig: 'mockSig' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get oracle info', async () => {
    const result = await controller.getOracleInfo('mockAddress');
    expect(result).toEqual({});
    expect(service.getOracleInfo).toHaveBeenCalledWith('mockAddress');
  });
});
