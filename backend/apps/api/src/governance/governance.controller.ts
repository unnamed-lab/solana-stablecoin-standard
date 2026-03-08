import { Controller, Post, Body, Param, Get, Logger } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { ProposeActionDto, ApproveProposalDto } from './dto/governance.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Governance (SSS-3)')
@Controller('api/v1/governance')
export class GovernanceController {
  private readonly logger = new Logger(GovernanceController.name);

  constructor(private readonly governanceService: GovernanceService) {}

  @Post('propose')
  @ApiOperation({ summary: 'Propose a new governance action (Multisig)' })
  @ApiResponse({ status: 201, description: 'Proposal created.', type: String })
  async propose(@Body() dto: ProposeActionDto) {
    this.logger.log(`Received propose request for action: ${dto.actionType}`);
    const result = await this.governanceService.proposeAction(dto);
    return result;
  }

  @Post('approve/:proposalId')
  @ApiOperation({ summary: 'Approve a pending governance proposal' })
  @ApiResponse({ status: 200, description: 'Proposal approved.', type: String })
  async approve(
    @Param('proposalId') proposalId: string,
    @Body() dto: ApproveProposalDto,
  ) {
    this.logger.log(`Received approve request for proposal: ${proposalId}`);
    const result = await this.governanceService.approveProposal(proposalId, dto);
    return result;
  }

  // NOTE: execute proposal endpoint would normally go here, but for simplicity
  // and security it's best executed via a specialized worker tracking time-locks
  // or a direct SDK call when needed.

  @Get('proposals')
  @ApiOperation({ summary: 'List all proposals for the default mint' })
  @ApiResponse({ status: 200, description: 'List of proposals returned.' })
  async getProposals() {
    this.logger.log(`Received request for proposals list.`);
    const result = await this.governanceService.getProposals();
    return result;
  }
}
