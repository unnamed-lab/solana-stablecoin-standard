import { Logger } from '@nestjs/common';
import {
  BorshCoder,
  EventParser as AnchorEventParser,
  Idl,
} from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { ParsedEvent } from '@app/shared';
import { CoreIdl as idl } from '@stbr/sss-token';

/**
 * Parses Anchor program events from Solana transaction logs.
 *
 * Anchor emits events as base64-encoded borsh data in program logs
 * with the format: "Program data: <base64>"
 */
export class EventParserUtil {
  private readonly logger = new Logger(EventParserUtil.name);
  private parser: AnchorEventParser;

  constructor(programId: string) {
    const coder = new BorshCoder(idl as unknown as Idl);
    this.parser = new AnchorEventParser(new PublicKey(programId), coder);
  }

  /**
   * Parse transaction logs into typed events.
   */
  parse(logs: string[]): ParsedEvent[] {
    const events: ParsedEvent[] = [];

    try {
      const generator = this.parser.parseLogs(logs, false);
      for (const event of generator) {
        events.push({
          name: event.name,
          data: this.serializeEventData(event.data),
        });
      }
    } catch (err) {
      this.logger.debug(`Failed to parse logs: ${err}`);
    }

    return events;
  }

  /**
   * Convert Anchor event data (PublicKey, BN) to plain JSON-serializable objects.
   */
  private serializeEventData(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    // PublicKey → base58 string
    if (data instanceof PublicKey) {
      return data.toBase58();
    }

    // BN → string
    if (
      data &&
      typeof data === 'object' &&
      'toString' in data &&
      'toNumber' in data
    ) {
      return (data as { toString(): string }).toString();
    }

    // Array
    if (Array.isArray(data)) {
      return data.map((item) => this.serializeEventData(item));
    }

    // Object
    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        data as Record<string, unknown>,
      )) {
        // Convert snake_case to camelCase for consistency
        const camelKey = key.replace(/_([a-z])/g, (_, c: string) =>
          c.toUpperCase(),
        );
        result[camelKey] = this.serializeEventData(value);
      }
      return result;
    }

    return data;
  }
}
