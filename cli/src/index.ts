#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
    registerCreateCommand,
    registerInfoCommand,
    registerMintCommand,
    registerBurnCommand,
    registerFreezeCommand,
    registerThawCommand,
    registerPauseCommand,
    registerUnpauseCommand,
    registerAddMinterCommand,
    registerRemoveMinterCommand,
    registerUpdateRolesCommand,
    registerProposeTransferCommand,
    registerAcceptTransferCommand,
    registerComplianceCommands,
    registerHookCommands,
} from './commands';

const program = new Command();

program
    .name('sss')
    .description(
        chalk.bold('Solana Stablecoin Standard CLI') +
        '\n  Deploy, manage, and govern stablecoins on Solana.\n'
    )
    .version('0.1.0');

// ── Token Lifecycle ─────────────────────────────────────────────────────
registerCreateCommand(program);
registerInfoCommand(program);

// ── Token Operations ────────────────────────────────────────────────────
registerMintCommand(program);
registerBurnCommand(program);
registerFreezeCommand(program);
registerThawCommand(program);

// ── Admin & Roles ───────────────────────────────────────────────────────
registerPauseCommand(program);
registerUnpauseCommand(program);
registerAddMinterCommand(program);
registerRemoveMinterCommand(program);
registerUpdateRolesCommand(program);
registerProposeTransferCommand(program);
registerAcceptTransferCommand(program);

// ── SSS-2 Compliance (subcommand group) ─────────────────────────────────
registerComplianceCommands(program);

// ── SSS-2 Transfer Hook (subcommand group) ──────────────────────────────
registerHookCommands(program);

// ── Parse & Execute ─────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err) => {
    console.error(chalk.red(`\n  ✗ Unexpected error: ${err.message}\n`));
    process.exit(1);
});
