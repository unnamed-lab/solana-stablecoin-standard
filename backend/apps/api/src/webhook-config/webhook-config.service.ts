import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhookConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWebhookDto) {
    return this.prisma.webhookConfig.create({
      data: {
        url: dto.url,
        events: dto.events,
        secret: dto.secret,
        active: dto.active ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const config = await this.prisma.webhookConfig.findUnique({
      where: { id },
    });
    if (!config) throw new NotFoundException(`Webhook ${id} not found`);
    return config;
  }

  async update(id: string, data: Partial<CreateWebhookDto>) {
    await this.findOne(id); // Throws if not found
    return this.prisma.webhookConfig.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.webhookConfig.delete({ where: { id } });
    return { deleted: true };
  }
}
