#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const commands_1 = require("./commands");
const program = new commander_1.Command();
program
    .name('sss')
    .description(chalk_1.default.bold('Solana Stablecoin Standard CLI') +
    '\n  Deploy, manage, and govern stablecoins on Solana.\n')
    .version('0.1.0');
// ── Token Lifecycle ─────────────────────────────────────────────────────
(0, commands_1.registerCreateCommand)(program);
(0, commands_1.registerInfoCommand)(program);
// ── Token Operations ────────────────────────────────────────────────────
(0, commands_1.registerMintCommand)(program);
(0, commands_1.registerBurnCommand)(program);
(0, commands_1.registerFreezeCommand)(program);
(0, commands_1.registerThawCommand)(program);
// ── Admin & Roles ───────────────────────────────────────────────────────
(0, commands_1.registerPauseCommand)(program);
(0, commands_1.registerUnpauseCommand)(program);
(0, commands_1.registerAddMinterCommand)(program);
(0, commands_1.registerRemoveMinterCommand)(program);
(0, commands_1.registerUpdateRolesCommand)(program);
(0, commands_1.registerProposeTransferCommand)(program);
(0, commands_1.registerAcceptTransferCommand)(program);
// ── SSS-2 Compliance (subcommand group) ─────────────────────────────────
(0, commands_1.registerComplianceCommands)(program);
// ── SSS-2 Transfer Hook (subcommand group) ──────────────────────────────
(0, commands_1.registerHookCommands)(program);
// ── Parse & Execute ─────────────────────────────────────────────────────
program.parseAsync(process.argv).catch((err) => {
    console.error(chalk_1.default.red(`\n  ✗ Unexpected error: ${err.message}\n`));
    process.exit(1);
});
//# sourceMappingURL=index.js.map