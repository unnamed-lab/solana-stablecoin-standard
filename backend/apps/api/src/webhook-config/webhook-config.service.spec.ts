import { Test, TestingModule } from '@nestjs/testing';
import { WebhookConfigService } from './webhook-config.service';
import { PrismaService } from '@app/database';
import { NotFoundException } from '@nestjs/common';
import { CreateWebhookDto } from './dto/create-webhook.dto';

describe('WebhookConfigService', () => {
    let service: WebhookConfigService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        webhookConfig: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhookConfigService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<WebhookConfigService>(WebhookConfigService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a webhook config', async () => {
            const dto: CreateWebhookDto = { url: 'http://test.com', events: ['MINT'], secret: 'sec' };
            const expectedResult = { id: '1', ...dto, active: true };

            mockPrismaService.webhookConfig.create.mockResolvedValue(expectedResult);

            const result = await service.create(dto);

            expect(mockPrismaService.webhookConfig.create).toHaveBeenCalledWith({
                data: {
                    url: dto.url,
                    events: dto.events,
                    secret: dto.secret,
                    active: true,
                },
            });
            expect(result).toEqual(expectedResult);
        });

        it('should create a webhook config with custom active status', async () => {
            const dto: CreateWebhookDto = { url: 'http://test.com', events: ['MINT'], secret: 'sec', active: false };
            const expectedResult = { id: '1', ...dto, active: false };

            mockPrismaService.webhookConfig.create.mockResolvedValue(expectedResult);

            const result = await service.create(dto);

            expect(mockPrismaService.webhookConfig.create).toHaveBeenCalledWith({
                data: {
                    url: dto.url,
                    events: dto.events,
                    secret: dto.secret,
                    active: false,
                },
            });
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findAll', () => {
        it('should return all webhook configs', async () => {
            const expectedResult = [{ id: '1' }, { id: '2' }];
            mockPrismaService.webhookConfig.findMany.mockResolvedValue(expectedResult);

            const result = await service.findAll();

            expect(mockPrismaService.webhookConfig.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            });
            expect(result).toEqual(expectedResult);
        });
    });

    describe('findOne', () => {
        it('should return a webhook config if found', async () => {
            const expectedResult = { id: '1' };
            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(expectedResult);

            const result = await service.findOne('1');

            expect(mockPrismaService.webhookConfig.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            });
            expect(result).toEqual(expectedResult);
        });

        it('should throw NotFoundException if not found', async () => {
            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(null);

            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
            expect(mockPrismaService.webhookConfig.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });
    });

    describe('update', () => {
        it('should update a webhook config if it exists', async () => {
            const existingConfig = { id: '1' };
            const dto = { url: 'http://new.com' };
            const updatedConfig = { id: '1', url: 'http://new.com' };

            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(existingConfig);
            mockPrismaService.webhookConfig.update.mockResolvedValue(updatedConfig);

            const result = await service.update('1', dto);

            expect(mockPrismaService.webhookConfig.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockPrismaService.webhookConfig.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: dto,
            });
            expect(result).toEqual(updatedConfig);
        });

        it('should throw NotFoundException if config does not exist', async () => {
            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(null);

            await expect(service.update('1', {})).rejects.toThrow(NotFoundException);
            expect(mockPrismaService.webhookConfig.update).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should remove a webhook config if it exists', async () => {
            const existingConfig = { id: '1' };

            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(existingConfig);
            mockPrismaService.webhookConfig.delete.mockResolvedValue(existingConfig);

            const result = await service.remove('1');

            expect(mockPrismaService.webhookConfig.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockPrismaService.webhookConfig.delete).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual({ deleted: true });
        });

        it('should throw NotFoundException if config does not exist', async () => {
            mockPrismaService.webhookConfig.findUnique.mockResolvedValue(null);

            await expect(service.remove('1')).rejects.toThrow(NotFoundException);
            expect(mockPrismaService.webhookConfig.delete).not.toHaveBeenCalled();
        });
    });
});
