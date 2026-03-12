import { Command } from 'commander';
import { PublicKey } from '@solana/web3.js';
import { SolanaStablecoin, SolanaNetwork, StablecoinPreset } from '@stbr/sss-token';
import ora from 'ora';
import chalk from 'chalk';
import {
    loadKeypair,
    getDefaultKeypairPath,
    printHeader,
    printField,
    printSuccess,
    printError,
} from '../utils';

import { intro, outro, text, select, isCancel, cancel } from "@clack/prompts";
import { saveToken, setActiveToken, loadConfig, 
  deleteAllTokens,
  deleteToken, type TokenEntry } from '../config';

export function registerCreateCommand(program: Command): void {
    program
        .command('create')
        .description('Deploy a new stablecoin to the blockchain')
        .requiredOption('--name <name>', 'Token name (e.g. "ACME USD")')
        .requiredOption('--symbol <symbol>', 'Token symbol (e.g. "AUSD")')
        .requiredOption('--uri <uri>', 'Metadata URI (e.g. "https://example.com/meta.json")')
        .option('--decimals <number>', 'Number of decimal places', '6')
        .option('--preset <preset>', 'Preset: sss1, sss2, or custom', 'sss1')
        .option('--keypair <path>', 'Path to authority keypair JSON', getDefaultKeypairPath())
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .option('--blacklister <pubkey>', 'Blacklister public key (SSS-2 only)')
        .option('--seizer <pubkey>', 'Seizer public key (SSS-2 only)')
        .action(async (opts) => {
            const spinner = ora('Deploying stablecoin...').start();

            try {
                const authority = loadKeypair(opts.keypair);
                const network = opts.network as SolanaNetwork;

                const presetMap: Record<string, StablecoinPreset> = {
                    sss1: StablecoinPreset.SSS_1,
                    sss2: StablecoinPreset.SSS_2,
                    custom: StablecoinPreset.CUSTOM,
                };
                const preset = presetMap[opts.preset];
                if (!preset) {
                    spinner.fail('Invalid preset. Use: sss1, sss2, or custom');
                    return;
                }

                const { txSig, mintAddress } = await SolanaStablecoin.create(
                    {
                        name: opts.name,
                        symbol: opts.symbol,
                        uri: opts.uri,
                        decimals: parseInt(opts.decimals),
                        preset,
                        authority,
                        blacklister: opts.blacklister ? new PublicKey(opts.blacklister) : undefined,
                        seizer: opts.seizer ? new PublicKey(opts.seizer) : undefined,
                    },
                    network,
                );

                spinner.stop();
                printHeader('Stablecoin Created');
                printField('Mint Address', mintAddress.toBase58());
                printField('Preset', opts.preset.toUpperCase());
                printField('Name', opts.name);
                printField('Symbol', opts.symbol);
                printField('Decimals', opts.decimals);
                printField('Network', network);
                printSuccess('Stablecoin deployed successfully', txSig);

                // ── Persist to ~/.sss/config.json ──
                const mint58 = mintAddress.toBase58();
                const entry: TokenEntry = {
                    name: opts.name,
                    symbol: opts.symbol,
                    preset: opts.preset,
                    network,
                    createdAt: new Date().toISOString(),
                    keypairPath: opts.keypair,
                    mintAddress: mint58,
                    decimals: parseInt(opts.decimals),
                };
                saveToken(mint58, entry);
                setActiveToken(mint58);
                console.log(chalk.gray(`\n  Saved to config & set as active token.`));
            } catch (err) {
                spinner.fail('Failed to create stablecoin');
                printError('Deployment failed', err);
                process.exit(1);
            }
        });
}

export function registerInfoCommand(program: Command): void {
    program
        .command('info')
        .description('Fetch on-chain info for an existing stablecoin')
        .requiredOption('--mint <pubkey>', 'Mint address of the stablecoin')
        .option('--network <network>', 'Network: devnet, mainnet, testnet, localnet', 'devnet')
        .action(async (opts) => {
            const spinner = ora('Fetching stablecoin info...').start();

            try {
                const mint = new PublicKey(opts.mint);
                const network = opts.network as SolanaNetwork;
                const sdk = await SolanaStablecoin.load(network, mint);
                const info = await sdk.getInfo();

                spinner.stop();
                printHeader('Stablecoin Info');
                printField('Mint', info.mint.toBase58());
                printField('Preset', info.preset.toUpperCase());
                printField('Name', info.name);
                printField('Symbol', info.symbol);
                printField('Total Supply', info.totalSupply);
                printField('Paused', info.paused);
                if (info.blacklistCount !== undefined) {
                    printField('Blacklist Count', info.blacklistCount);
                }
                console.log();
            } catch (err) {
                spinner.fail('Failed to fetch stablecoin info');
                printError('Could not load stablecoin', err);
                process.exit(1);
            }
        });
}

export function registerListCommand(program: Command): void {
    program
        .command('list')
        .description('List all locally stored tokens')
        .action(() => {
            const config = loadConfig();
            const mints = Object.keys(config.tokens);

            printHeader('Stored Tokens');

            if (mints.length === 0) {
                console.log(chalk.gray('  No tokens stored yet. Run sss-token create to get started.'));
                console.log();
                return;
            }

            for (const mint of mints) {
                const t = config.tokens[mint];
                const active = mint === config.activeToken ? chalk.green(' (active)') : '';
                console.log(`  ${chalk.cyan(t.symbol)} — ${t.name}${active}`);
                console.log(chalk.gray(`    Mint:    ${mint}`));
                console.log(chalk.gray(`    Network: ${t.network}  |  Preset: ${t.preset}  |  Decimals: ${t.decimals}`));
                console.log(chalk.gray(`    Created: ${t.createdAt}`));
                console.log();
            }
        });
}

export function registerUseCommand(program: Command): void {
    program
        .command('use')
        .description('Set a stored token as the active token')
        .argument('<mint>', 'Mint address of the token to activate')
        .action((mint: string) => {
            const config = loadConfig();
            if (!config.tokens[mint]) {
                printError(
                    'Token not found',
                    new Error(`No stored token with mint ${mint}.\nRun sss-token list to see available tokens.`),
                );
                process.exit(1);
            }
            setActiveToken(mint);
            const t = config.tokens[mint];
            printSuccess(`Active token set to ${t.symbol} (${mint})`);
        });
}

export function registerDeleteCommand(program: Command): void {
  program
    .command("delete")
    .description(
      "Remove a token from your local config (on-chain token is unaffected)",
    )
    .argument("[mint]", "Mint address of the token to remove")
    .action(async (mintArg?: string) => {
      const config = loadConfig();
      const mints = Object.keys(config.tokens);

      if (mints.length === 0) {
        console.log(chalk.gray("\n  No tokens stored. Nothing to delete.\n"));
        process.exit(0);
      }

      let mint = mintArg;

      // ── If no mint argument, prompt the user to pick one ───────────
      if (!mint) {
        intro(chalk.bgRed.white(" Remove Token from Local Config "));

        const res = await select({
          message: "Which token do you want to remove?",
          options: mints.map((m) => ({
            value: m,
            label: `${config.tokens[m].symbol} — ${config.tokens[m].name}`,
            hint: `${m.slice(0, 8)}...  ${
              config.tokens[m].network
            }  ${config.tokens[m].preset.toUpperCase()}`,
          })),
        });

        if (isCancel(res)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        mint = res as string;
      }

      const entry = config.tokens[mint];
      if (!entry) {
        printError(
          "Token not found",
          new Error(
            `No stored token with mint ${mint}.\nRun sss-token list to see available tokens.`,
          ),
        );
        process.exit(1);
      }

      // ── Confirm before deleting ────────────────────────────────────
      console.log();
      console.log(
        chalk.yellow(
          "  ⚠  This will remove the token from your local config only.",
        ),
      );
      console.log(
        chalk.gray(
          "     The token still exists on-chain and is not affected.\n",
        ),
      );

      printHeader("Token to Remove");
      printField("Name", entry.name);
      printField("Symbol", entry.symbol);
      printField("Mint", mint);
      printField("Network", entry.network);
      printField("Preset", entry.preset.toUpperCase());
      console.log();

      const confirm = await select({
        message: "Are you sure you want to remove this token?",
        options: [
          { value: false, label: "No, keep it" },
          { value: true, label: `Yes, remove ${entry.symbol}` },
        ],
      });

      if (isCancel(confirm) || !confirm) {
        cancel("Cancelled. Token was not removed.");
        process.exit(0);
      }

      // ── Delete ─────────────────────────────────────────────────────
      const deleted = deleteToken(mint);
      if (!deleted) {
        printError(
          "Delete failed",
          new Error("Token was not found in config."),
        );
        process.exit(1);
      }

      // Inform user about new active token if it changed
      const updatedConfig = (await import("../config")).loadConfig();
      const newActive = updatedConfig.activeToken;

      console.log();
      console.log(
        chalk.green(
          `  ✓ Removed ${deleted.symbol} (${mint.slice(
            0,
            8,
          )}...) from local config.`,
        ),
      );

      if (newActive) {
        const next = updatedConfig.tokens[newActive];
        console.log(
          chalk.gray(
            `  Active token is now: ${next.symbol} — ${newActive.slice(
              0,
              8,
            )}...`,
          ),
        );
      } else {
        console.log(
          chalk.gray("  No active token. Run sss-token init to create one."),
        );
      }

      console.log();

      if (!mintArg) {
        outro(chalk.green("Done."));
      }
    });
}

export function registerDeleteAllCommand(program: Command): void {
    program
        .command('delete-all')
        .description('Remove ALL tokens from your local config (on-chain tokens are unaffected)')
        .action(async () => {
            const config = loadConfig();
            const mints = Object.keys(config.tokens);
 
            if (mints.length === 0) {
                console.log(chalk.gray('\n  No tokens stored. Nothing to delete.\n'));
                process.exit(0);
            }
 
            intro(chalk.bgRed.white(' Remove ALL Tokens from Local Config '));
 
            console.log(chalk.yellow(`  ⚠  This will remove all ${mints.length} token(s) from your local config.`));
            console.log(chalk.gray('     Your on-chain tokens are NOT affected in any way.\n'));
 
            // Show what will be deleted
            for (const mint of mints) {
                const t = config.tokens[mint];
                const active = mint === config.activeToken ? chalk.green(' (active)') : '';
                console.log(`  ${chalk.cyan(t.symbol)} — ${t.name}${active}`);
                console.log(chalk.gray(`    ${mint.slice(0, 8)}...  ${t.network}  ${t.preset.toUpperCase()}`));
            }
            console.log();
 
            // First confirmation
            const first = await select({
                message: `Remove all ${mints.length} token(s) from local config?`,
                options: [
                    { value: false, label: 'No, keep them' },
                    { value: true,  label: 'Yes, remove all' },
                ],
            });
 
            if (isCancel(first) || !first) {
                cancel('Cancelled. No tokens were removed.');
                process.exit(0);
            }
 
            // Second confirmation — extra safety for destructive bulk action
            const second = await select({
                message: 'Are you absolutely sure? This cannot be undone.',
                options: [
                    { value: false, label: 'No, cancel' },
                    { value: true,  label: `Yes, delete all ${mints.length} token(s)` },
                ],
            });
 
            if (isCancel(second) || !second) {
                cancel('Cancelled. No tokens were removed.');
                process.exit(0);
            }
 
            // ── Delete all ─────────────────────────────────────────────────
            const count = deleteAllTokens();
 
            console.log();
            console.log(chalk.green(`  ✓ Removed ${count} token(s) from local config.`));
            console.log(chalk.gray('  Run sss-token init to create a new token.\n'));
 
            outro(chalk.green('Done.'));
        });
}
