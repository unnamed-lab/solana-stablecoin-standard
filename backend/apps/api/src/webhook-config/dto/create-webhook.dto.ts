import {
  IsString,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUrl,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({
    example: 'https://example.com/webhook',
    description: 'URL to deliver webhook events to',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    example: ['Minted', 'Burned', '*'],
    description: 'Event types to subscribe to. Use "*" for all events.',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events: string[];

  @ApiProperty({
    description: 'HMAC secret for signing webhook payloads',
  })
  @IsString()
  secret: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this webhook is active (default: true)',
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
