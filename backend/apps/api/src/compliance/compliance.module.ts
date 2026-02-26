import { Module } from '@nestjs/common';
import { BlockchainModule } from '@app/blockchain';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

@Module({
    imports: [BlockchainModule],
    controllers: [ComplianceController],
    providers: [ComplianceService],
})
export class ComplianceModule { }
