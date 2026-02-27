import { Test, TestingModule } from '@nestjs/testing';
import { WebhookConfigController } from './webhook-config.controller';
import { WebhookConfigService } from './webhook-config.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

describe('WebhookConfigController', () => {
    let controller: WebhookConfigController;
    let service: WebhookConfigService;

    const mockWebhookConfigService = {
        create: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WebhookConfigController],
            providers: [
                {
                    provide: WebhookConfigService,
                    useValue: mockWebhookConfigService,
                },
            ],
        }).compile();

        controller = module.get<WebhookConfigController>(WebhookConfigController);
        service = module.get<WebhookConfigService>(WebhookConfigService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should call webhookConfigService.create and return the result', async () => {
            const dto: CreateWebhookDto = { url: 'http://test.com', events: ['MINT'], secret: 'sec' };
            const expectedResult = { id: '1', ...dto };

            mockWebhookConfigService.create.mockResolvedValue(expectedResult);

            const result = await controller.create(dto);

            expect(mockWebhookConfigService.create).toHaveBeenCalledWith(dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findAll', () => {
        it('should call webhookConfigService.findAll and return the result', async () => {
            const expectedResult = [{ id: '1', url: 'http://test.com' }];
            mockWebhookConfigService.findAll.mockResolvedValue(expectedResult);

            const result = await controller.findAll();

            expect(mockWebhookConfigService.findAll).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findOne', () => {
        it('should call webhookConfigService.findOne and return the result', async () => {
            const expectedResult = { id: '1', url: 'http://test.com' };
            mockWebhookConfigService.findOne.mockResolvedValue(expectedResult);

            const result = await controller.findOne('1');

            expect(mockWebhookConfigService.findOne).toHaveBeenCalledWith('1');
            expect(result).toEqual(expectedResult);
        });
    });

    describe('update', () => {
        it('should call webhookConfigService.update and return the result', async () => {
            const dto: Partial<CreateWebhookDto> = { url: 'http://test2.com' };
            const expectedResult = { id: '1', url: 'http://test2.com' };

            mockWebhookConfigService.update.mockResolvedValue(expectedResult);

            const result = await controller.update('1', dto);

            expect(mockWebhookConfigService.update).toHaveBeenCalledWith('1', dto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('remove', () => {
        it('should call webhookConfigService.remove and return the result', async () => {
            const expectedResult = { deleted: true };

            mockWebhookConfigService.remove.mockResolvedValue(expectedResult);

            const result = await controller.remove('1');

            expect(mockWebhookConfigService.remove).toHaveBeenCalledWith('1');
            expect(result).toEqual(expectedResult);
        });
    });
});
