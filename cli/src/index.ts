#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import {
    registerCreateCommand,
    registerInfoCommand,
    registerListCommand,
    registerUseCommand,
    registerMintCommand,
    registerBurnCommand,
    registerFreezeCommand,
    registerThawCommand,
    registerHoldersCommand,
    registerPauseCommand,
    registerUnpauseCommand,
    registerAddMinterCommand,
    registerRemoveMinterCommand,
    registerUpdateRolesCommand,
    registerProposeTransferCommand,
    registerAcceptTransferCommand,
    registerComplianceCommands,
    registerHookCommands,
    registerConfigCommands,
} from './commands';

const program = new Command();

program
    .name('sss-token')
    .description(
        chalk.bold('Solana Stablecoin Standard CLI') +
        '\n  Deploy, manage, and govern stablecoins on Solana.\n'
    )
    .version('0.1.0');

// ── Token Lifecycle ─────────────────────────────────────────────────────
registerCreateCommand(program);
registerInfoCommand(program);
registerListCommand(program);
registerUseCommand(program);

// ── Token Operations ────────────────────────────────────────────────────
registerMintCommand(program);
registerBurnCommand(program);
registerFreezeCommand(program);
registerThawCommand(program);
registerHoldersCommand(program);

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

// ── Custom Presets & Lists ──────────────────────────────────────────────
registerConfigCommands(program);

// ── Parse & Execute ─────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err) => {
    console.error(chalk.red(`\n  ✗ Unexpected error: ${err.message}\n`));
    process.exit(1);
});
