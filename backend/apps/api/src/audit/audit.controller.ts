import { Controller, Get, Query, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@Controller('api/v1/audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated audit log entries' })
  @ApiQuery({
    name: 'mint',
    required: false,
    description: 'Filter by mint address',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action type (MINT, BURN, SEIZE, etc.)',
  })
  @ApiQuery({
    name: 'actor',
    required: false,
    description: 'Filter by actor address',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 200)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated audit log entries',
  })
  async getAuditLog(
    @Query('mint') mint?: string,
    @Query('action') action?: string,
    @Query('actor') actor?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.auditService.getAuditLog({
      mint,
      action,
      actor,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export audit log as CSV file' })
  @ApiQuery({ name: 'mint', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=audit-log.csv')
  async exportCsv(
    @Query('mint') mint?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.exportCsv({ mint, action });
  }
}
