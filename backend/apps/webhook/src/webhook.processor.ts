import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { createHmac } from 'crypto';
import { PrismaService } from '@app/database';
import { WEBHOOK_QUEUE } from '@app/shared';

@Processor(WEBHOOK_QUEUE)
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('notify')
  async handleNotify(
    job: Job<{
      event: { name: string; data: any };
      signature: string;
    }>,
  ) {
    const { event, signature } = job.data;

    // Find all active webhooks subscribed to this event type
    const subscribers = await this.prisma.webhookConfig.findMany({
      where: { active: true },
    });

    const filtered = subscribers.filter(
      (w) => w.events.includes('*') || w.events.includes(event.name),
    );

    if (!filtered.length) {
      this.logger.debug(`No subscribers for event: ${event.name}`);
      return;
    }

    const results = await Promise.allSettled(
      filtered.map((webhook) =>
        this.deliver(webhook, event, signature, job.attemptsMade),
      ),
    );

    // Log delivery results
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `${failed.length}/${filtered.length} webhook deliveries failed for ${event.name}`,
      );
      // If any delivery failed, throw to trigger Bull retry
      throw new Error(`Failed to deliver to ${failed.length} webhook(s)`);
    }
  }

  private async deliver(
    webhook: { url: string; secret: string; id: string },
    event: { name: string; data: any },
    txSignature: string,
    attemptsMade: number,
  ) {
    const payload = JSON.stringify({
      event: event.name,
      data: event.data,
      txSignature,
      timestamp: Date.now(),
    });

    const hmacSignature = createHmac('sha256', webhook.secret)
      .update(payload)
      .digest('hex');

    // Dynamic import of axios to avoid bundling issues
    const axios = (await import('axios')).default;

    try {
      await axios.post(webhook.url, JSON.parse(payload), {
        headers: {
          'Content-Type': 'application/json',
          'X-SSS-Signature': `sha256=${hmacSignature}`,
          'X-SSS-Event': event.name,
        },
        timeout: 10_000,
      });

      this.logger.log(`✅ Webhook delivered: ${event.name} → ${webhook.url}`);
    } catch (err: any) {
      this.logger.warn(
        `❌ Webhook failed: ${webhook.url} | attempt ${attemptsMade + 1} | ${err.message}`,
      );
      throw err; // Bull catches this and retries with exponential backoff
    }
  }
}
