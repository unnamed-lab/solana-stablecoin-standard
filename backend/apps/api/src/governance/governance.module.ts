import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceService } from './governance.service';
import { BlockchainModule } from '@app/blockchain';

@Module({
    imports: [BlockchainModule],
    controllers: [GovernanceController],
    providers: [GovernanceService],
    exports: [GovernanceService],
})
export class GovernanceModule { }
