import { Command } from "commander";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  SolanaStablecoin,
  SolanaNetwork,
  StablecoinPreset,
} from "@stbr/sss-token";
import ora from "ora";
import chalk from "chalk";
import {
  loadKeypair,
  getDefaultKeypairPath,
  printHeader,
  printField,
  printSuccess,
  printError,
} from "../utils";
import {
  saveToken,
  setActiveToken,
  loadConfig,
  deleteAllTokens,
  deleteToken,
  type TokenEntry,
} from "../config";
import { parseAndValidateConfigFile } from "../config-validator";
import { intro, outro, text, select, isCancel, cancel } from "@clack/prompts";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Deploy a new stablecoin to the blockchain or view existing")
    .option("--name <name>", 'Token name (e.g. "ACME USD")')
    .option("--symbol <symbol>", 'Token symbol (e.g. "AUSD")')
    .option(
      "--uri <uri>",
      'Metadata URI (e.g. "https://example.com/meta.json")',
    )
    .option("--decimals <number>", "Number of decimal places")
    .option("--preset <preset>", "Preset: sss1, sss2, sss3, or custom")
    .option("--custom <path>", "Initialize from a TOML or JSON config file")
    .option(
      "--keypair <path>",
      "Path to authority keypair JSON",
      getDefaultKeypairPath(),
    )
    .option(
      "--network <network>",
      "Network: devnet, mainnet, testnet, localnet",
    )
    .option("--blacklister <pubkey>", "Blacklister public key (SSS-2 only)")
    .option("--seizer <pubkey>", "Seizer public key (SSS-2 only)")
    .option("--auto-approve", "Auto-approve new accounts for confidential transfers (SSS-3 only)")
    .option("--compliance-note <note>", "Initial compliance note (SSS-3 only)")
    .option("--auditor <base64>", "Auditor ElGamal Public Key in Base64 (SSS-3 only)")
    .action(async (opts) => {
      const config = loadConfig();

      // ── Active token exists and no creation flags were passed ──────────
      if (
        config.activeToken &&
        !opts.preset &&
        !opts.custom &&
        !opts.name &&
        !opts.symbol
      ) {
        const active = config.tokens[config.activeToken];

        console.log(chalk.green(`\n  ✓ Active Token Found`));
        console.log(
          chalk.gray(`    Name:    ${active.name} (${active.symbol})`),
        );
        console.log(chalk.gray(`    Mint:    ${config.activeToken}`));
        console.log(
          chalk.gray(
            `    Network: ${
              active.network
            }  |  Preset: ${active.preset.toUpperCase()}`,
          ),
        );
        console.log();

        const answer = await select({
          message: "What would you like to do?",
          options: [
            {
              value: "commands",
              label: "Show available commands for this token",
            },
            { value: "create", label: "Create a new token" },
            { value: "exit", label: "Exit" },
          ],
        });

        if (isCancel(answer) || answer === "exit") {
          cancel("Operation cancelled.");
          process.exit(0);
        }

        if (answer === "commands") {
          console.log(chalk.bold("\n  Available Commands\n"));

          console.log(chalk.cyan("  Operations"));
          console.log("    sss-token mint <recipient> <amount>");
          console.log("    sss-token burn <amount>");
          console.log("    sss-token transfer <sender> <recipient> <amount>");
          console.log("    sss-token holders");
          console.log("    sss-token info");

          if (active.preset === "sss2" || active.preset === "sss3") {
            console.log(chalk.cyan("\n  Compliance"));
            console.log("    sss-token freeze <address>");
            console.log("    sss-token thaw <address>");
            console.log(
              '    sss-token blacklist add <address> --reason "<reason>"',
            );
            console.log("    sss-token blacklist remove <address>");
            console.log("    sss-token seize <address> --to <treasury>");
            console.log("    sss-token pause");
            console.log("    sss-token unpause");
          }

          console.log(chalk.cyan("\n  Management"));
          console.log("    sss-token add-minter <pubkey>");
          console.log("    sss-token remove-minter <pubkey>");
          console.log("    sss-token update-roles");
          console.log("    sss-token list");
          console.log("    sss-token use <mint>");
          console.log();

          process.exit(0);
        }

        // answer === 'create' — fall through to creation flow
      }

      let {
        name,
        symbol,
        uri,
        decimals,
        preset: presetName,
        network: networkName,
        keypair: keypairPath,
        blacklister,
        seizer,
        autoApprove,
        complianceNote,
        auditor,
        custom,
      } = opts;

      // ── Config file mode ──────────────────────────────────────────────
      if (custom) {
        const result = parseAndValidateConfigFile(custom);

        if (!result.ok) {
          console.error(
            chalk.red(`\n  ✗ Your config file has the following issues:\n`),
          );
          result.errors.forEach((e: string) => {
            console.error(chalk.red(`    · ${e}`));
          });
          console.error(
            chalk.gray(
              `\n  Tip: Run  sss-token config example --preset sss2 > config.toml  to generate a valid template\n`,
            ),
          );
          process.exit(1);
        }

        const cfg = result.config;
        name = cfg.name;
        symbol = cfg.symbol;
        uri = cfg.uri;
        decimals = cfg.decimals.toString();
        presetName = cfg.preset;
        networkName = cfg.network;
        keypairPath = cfg.authorities.keypair.replace(
          /^~/,
          process.env.HOME ?? "~",
        );

        if (cfg.authorities.blacklister)
          blacklister = cfg.authorities.blacklister;
        if (cfg.authorities.seizer) seizer = cfg.authorities.seizer;

        console.log(
          chalk.green(`\n  ✓ Config file valid — deploying from "${custom}"\n`),
        );
      }

      // ── Interactive mode if required fields are missing ───────────────
      const isInteractive =
        !name || !symbol || !decimals || (!presetName && !custom);

      if (isInteractive) {
        console.log();
        intro(chalk.bgCyan.black(" SSS Stablecoin Creation "));

        if (!name) {
          const res = await text({
            message: "What is the name of your stablecoin?",
            placeholder: "e.g. ACME USD",
            validate: (value: string | undefined) => {
              if (!value) return "Name is required";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          name = res;
        }

        if (!symbol) {
          const res = await text({
            message: "What is the symbol?",
            placeholder: "e.g. AUSD",
            validate: (value: string | undefined) => {
              if (!value) return "Symbol is required";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          symbol = res;
        }

        if (!uri) {
          const res = await text({
            message: "What is the metadata URI?",
            placeholder: "e.g. https://example.com/meta.json",
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          uri = res || "";
        }

        if (!decimals) {
          const res = await text({
            message: "How many decimal places?",
            initialValue: "6",
            validate: (value: string | undefined) => {
              if (!value || isNaN(parseInt(value))) return "Must be a number";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          decimals = res;
        }

        if (!presetName) {
          const res = await select({
            message: "Select a stablecoin preset:",
            options: [
              { value: "sss1", label: "SSS-1 (Basic Stablecoin)" },
              { value: "sss2", label: "SSS-2 (Compliance & Seizure)" },
              {
                value: "sss3",
                label: "SSS-3 (Confidential & Scoped Allowlists)",
              },
              { value: "custom", label: "Custom" },
            ],
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          presetName = res as string;
        }

        if (!networkName) {
          const res = await select({
            message: "Select target network:",
            options: [
              { value: "devnet", label: "Devnet" },
              { value: "mainnet-beta", label: "Mainnet-Beta" },
              { value: "testnet", label: "Testnet" },
              { value: "localnet", label: "Localnet" },
            ],
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          networkName = res as string;
        }

        if (
          (presetName === "sss2" || presetName === "sss3") &&
          !blacklister &&
          !seizer
        ) {
          const configureAdvanced = await select({
            message: `Configure advanced ${presetName.toUpperCase()} roles (blacklister, seizer)?`,
            options: [
              {
                value: "no",
                label: "No, use my authority address for all roles",
              },
              {
                value: "yes",
                label: "Yes, I want to specify different addresses",
              },
            ],
          });

          if (configureAdvanced === "yes") {
            const bl = await text({
              message: "Blacklister public key:",
              placeholder: "Pubkey of the blacklister authority",
              validate: (value: string | undefined) => {
                if (value) {
                  try {
                    new PublicKey(value);
                  } catch {
                    return "Invalid public key";
                  }
                }
              },
            });
            if (isCancel(bl)) {
              cancel("Operation cancelled.");
              process.exit(0);
            }
            blacklister = bl as string;

            const sz = await text({
              message: "Seizer public key:",
              placeholder: "Pubkey of the seizer authority",
              validate: (value: string | undefined) => {
                if (value) {
                  try {
                    new PublicKey(value);
                  } catch {
                    return "Invalid public key";
                  }
                }
              },
            });
            if (isCancel(sz)) {
              cancel("Operation cancelled.");
              process.exit(0);
            }
            seizer = sz as string;
          }
        }

        if (presetName === "sss3" && !custom) {
          if (opts.autoApprove === undefined) {
             const autoApproveRes = await select({
               message: "Auto-approve new accounts for confidential transfers?",
               options: [
                 { value: "yes", label: "Yes" },
                 { value: "no", label: "No" },
               ],
             });
             if (isCancel(autoApproveRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             autoApprove = autoApproveRes === "yes";
          }
          if (!complianceNote) {
             const noteRes = await text({
               message: "Enter an initial compliance note:",
               initialValue: "Initial Deployment",
               validate: (value: string | undefined) => {
                 if (!value) return "Compliance note is required";
               },
             });
             if (isCancel(noteRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             complianceNote = noteRes as string;
          }
          if (!auditor) {
             const audRes = await text({
               message: "Optional: Provide a 64-byte Auditor ElGamal Public Key (Base64) or leave empty:",
             });
             if (isCancel(audRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             auditor = audRes || undefined;
          }
        }
      }

      if (!decimals) decimals = "6";
      if (!networkName) networkName = "devnet";
      if (!presetName) presetName = "sss1";
      if (!complianceNote) complianceNote = "Initial Deployment";

      const spinnerMsg = ora('Connecting to network...').start();

      try {
        const authority = loadKeypair(keypairPath);
        const network = networkName as SolanaNetwork;

        const presetMap: Record<string, StablecoinPreset> = {
          sss1: StablecoinPreset.SSS_1,
          sss2: StablecoinPreset.SSS_2,
          sss3: StablecoinPreset.SSS_3,
          custom: StablecoinPreset.CUSTOM,
        };
        const preset = presetMap[presetName];
        if (!preset) {
          spinnerMsg.fail("Invalid preset. Use: sss1, sss2, sss3, or custom");
          return;
        }

        let effectivePreset = preset;
        if (preset === StablecoinPreset.SSS_3) {
            effectivePreset = StablecoinPreset.SSS_2; // deploy as SSS-2 first
        }

        spinnerMsg.text = 'Deploying stablecoin...';
        const { txSig, mintAddress } = await SolanaStablecoin.create(
          {
            name,
            symbol,
            uri,
            decimals: parseInt(decimals),
            preset: effectivePreset,
            authority,
            blacklister: blacklister ? new PublicKey(blacklister) : undefined,
            seizer: seizer ? new PublicKey(seizer) : undefined,
          },
          network,
        );

        spinnerMsg.text = 'Saving to local config...';
        const mint58 = mintAddress.toBase58();
        const entry: TokenEntry = {
          name,
          symbol,
          preset: presetName,
          network,
          createdAt: new Date().toISOString(),
          keypairPath: keypairPath,
          mintAddress: mint58,
          decimals: parseInt(decimals),
        };
        saveToken(mint58, entry);
        setActiveToken(mint58);

        if (presetName === "sss3") {
          spinnerMsg.text = 'Waiting for deployment confirmation...';
          let freshSdk;
          for (let attempt = 0; attempt < 5; attempt++) {
              try {
                  freshSdk = await SolanaStablecoin.load(network, mintAddress);
                  break;
              } catch {
                  if (attempt === 4) throw new Error('Config PDA not yet visible after deployment');
                  await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              }
          }

          spinnerMsg.text = 'Initializing transfer hook...';
          await freshSdk!.transferHook.initializeHook(authority, authority, true);

          spinnerMsg.text = 'Registering transfer hook account metas...';
          await freshSdk!.transferHook.initializeExtraAccountMetaList(authority, authority);

          spinnerMsg.text = 'Upgrading to SSS-3 (confidential transfers + allowlist)...';
          let auditorArray: Uint8Array | undefined = undefined;
          if (auditor) {
            auditorArray = new Uint8Array(Buffer.from(auditor, 'base64'));
          }
          await freshSdk!.sss3.initialize(authority, {
             auditorPubkey: auditorArray,
             autoApproveNewAccounts: autoApprove || false,
             complianceNote: complianceNote || "Initial Deployment",
          });
        }

        spinnerMsg.stop();

        if (isInteractive) {
          outro(chalk.green("Stablecoin deployed successfully!"));
        }

        printHeader("Stablecoin Created");
        printField("Mint Address", mintAddress.toBase58());
        printField("Preset", presetName.toUpperCase());
        printField("Name", name);
        printField("Symbol", symbol);
        printField("Decimals", decimals);
        printField("Network", network);
        printSuccess("Deployment details", txSig);
        console.log(chalk.gray(`\n  Saved to config & set as active token.`));
      } catch (err) {
        spinnerMsg.fail("Failed to create stablecoin");
        printError("Deployment failed", err);
        process.exit(1);
      }
    });
}

export function registerCreateCommand(program: Command): void {
  program
    .command("create")
    .description("Deploy a new stablecoin to the blockchain")
    .option("--name <n>", 'Token name (e.g. "ACME USD")')
    .option("--symbol <symbol>", 'Token symbol (e.g. "AUSD")')
    .option(
      "--uri <uri>",
      'Metadata URI (e.g. "https://example.com/meta.json")',
    )
    .option("--decimals <number>", "Number of decimal places")
    .option("--preset <preset>", "Preset: sss1, sss2, sss3, or custom")
    .option(
      "--keypair <path>",
      "Path to authority keypair JSON",
      getDefaultKeypairPath(),
    )
    .option(
      "--network <network>",
      "Network: devnet, mainnet, testnet, localnet",
    )
    .option("--blacklister <pubkey>", "Blacklister public key (SSS-2 only)")
    .option("--seizer <pubkey>", "Seizer public key (SSS-2 only)")
    .option("--auto-approve", "Auto-approve new accounts for confidential transfers (SSS-3 only)")
    .option("--compliance-note <note>", "Initial compliance note (SSS-3 only)")
    .option("--auditor <base64>", "Auditor ElGamal Public Key in Base64 (SSS-3 only)")
    .action(async (opts) => {
      let {
        name,
        symbol,
        uri,
        decimals,
        preset: presetName,
        network: networkName,
        keypair: keypairPath,
        blacklister,
        seizer,
        autoApprove,
        complianceNote,
        auditor,
      } = opts;

      const isInteractive = !name || !symbol || !uri;

      if (isInteractive) {
        console.log();
        intro(chalk.bgCyan.black(" SSS Stablecoin Creation "));

        if (!name) {
          const res = await text({
            message: "What is the name of your stablecoin?",
            placeholder: "e.g. ACME USD",
            validate: (value: string | undefined) => {
              if (!value) return "Name is required";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          name = res;
        }

        if (!symbol) {
          const res = await text({
            message: "What is the symbol?",
            placeholder: "e.g. AUSD",
            validate: (value: string | undefined) => {
              if (!value) return "Symbol is required";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          symbol = res;
        }

        if (!uri) {
          const res = await text({
            message: "What is the metadata URI?",
            placeholder: "e.g. https://example.com/meta.json",
            validate: (value: string | undefined) => {
              if (!value) return "Metadata URI is required";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          uri = res;
        }

        if (!decimals) {
          const res = await text({
            message: "How many decimal places?",
            initialValue: "6",
            validate: (value: string | undefined) => {
              if (!value || isNaN(parseInt(value))) return "Must be a number";
            },
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          decimals = res;
        }

        if (!presetName) {
          const res = await select({
            message: "Select a stablecoin preset:",
            options: [
              { value: "sss1", label: "SSS-1 (Basic Stablecoin)" },
              { value: "sss2", label: "SSS-2 (Compliance & Seizure)" },
              {
                value: "sss3",
                label: "SSS-3 (Confidential & Scoped Allowlists)",
              },
              { value: "custom", label: "Custom" },
            ],
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          presetName = res as string;
        }

        if (!networkName) {
          const res = await select({
            message: "Select target network:",
            options: [
              { value: "devnet", label: "Devnet" },
              { value: "mainnet-beta", label: "Mainnet-Beta" },
              { value: "testnet", label: "Testnet" },
              { value: "localnet", label: "Localnet" },
            ],
          });
          if (isCancel(res)) {
            cancel("Operation cancelled.");
            process.exit(0);
          }
          networkName = res as string;
        }

        if (
          (presetName === "sss2" || presetName === "sss3") &&
          !blacklister &&
          !seizer
        ) {
          const configureAdvanced = await select({
            message: `Configure advanced ${presetName.toUpperCase()} roles (blacklister, seizer)?`,
            options: [
              {
                value: "no",
                label: "No, use my authority address for all roles",
              },
              {
                value: "yes",
                label: "Yes, I want to specify different addresses",
              },
            ],
          });

          if (configureAdvanced === "yes") {
            const bl = await text({
              message: "Blacklister public key:",
              placeholder: "Pubkey of the blacklister authority",
              validate: (value: string | undefined) => {
                if (value) {
                  try {
                    new PublicKey(value);
                  } catch {
                    return "Invalid public key";
                  }
                }
              },
            });
            if (isCancel(bl)) {
              cancel("Operation cancelled.");
              process.exit(0);
            }
            blacklister = bl as string;

            const sz = await text({
              message: "Seizer public key:",
              placeholder: "Pubkey of the seizer authority",
              validate: (value: string | undefined) => {
                if (value) {
                  try {
                    new PublicKey(value);
                  } catch {
                    return "Invalid public key";
                  }
                }
              },
            });
            if (isCancel(sz)) {
              cancel("Operation cancelled.");
              process.exit(0);
            }
            seizer = sz as string;
          }
        }

        if (presetName === "sss3") {
          if (opts.autoApprove === undefined) {
             const autoApproveRes = await select({
               message: "Auto-approve new accounts for confidential transfers?",
               options: [
                 { value: "yes", label: "Yes" },
                 { value: "no", label: "No" },
               ],
             });
             if (isCancel(autoApproveRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             autoApprove = autoApproveRes === "yes";
          }
          if (!complianceNote) {
             const noteRes = await text({
               message: "Enter an initial compliance note:",
               initialValue: "Initial Deployment",
               validate: (value: string | undefined) => {
                 if (!value) return "Compliance note is required";
               },
             });
             if (isCancel(noteRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             complianceNote = noteRes as string;
          }
          if (!auditor) {
             const audRes = await text({
               message: "Optional: Provide a 64-byte Auditor ElGamal Public Key (Base64) or leave empty:",
             });
             if (isCancel(audRes)) {
               cancel("Operation cancelled.");
               process.exit(0);
             }
             auditor = audRes || undefined;
          }
        }
      }

      if (!decimals) decimals = "6";
      if (!networkName) networkName = "devnet";
      if (!presetName) presetName = "sss1";
      if (!complianceNote) complianceNote = "Initial Deployment";

      const spinnerMsg = ora('Connecting to network...').start();

      try {
        const authority = loadKeypair(keypairPath);
        const network = networkName as SolanaNetwork;

        const presetMap: Record<string, StablecoinPreset> = {
          sss1: StablecoinPreset.SSS_1,
          sss2: StablecoinPreset.SSS_2,
          sss3: StablecoinPreset.SSS_3,
          custom: StablecoinPreset.CUSTOM,
        };
        const preset = presetMap[presetName];
        if (!preset) {
          spinnerMsg.fail("Invalid preset. Use: sss1, sss2, sss3, or custom");
          return;
        }

        let effectivePreset = preset;
        if (preset === StablecoinPreset.SSS_3) {
            effectivePreset = StablecoinPreset.SSS_2; // deploy as SSS-2 first
        }

        spinnerMsg.text = 'Deploying stablecoin...';
        const { txSig, mintAddress } = await SolanaStablecoin.create(
          {
            name,
            symbol,
            uri,
            decimals: parseInt(decimals),
            preset: effectivePreset,
            authority,
            blacklister: blacklister ? new PublicKey(blacklister) : undefined,
            seizer: seizer ? new PublicKey(seizer) : undefined,
          },
          network,
        );

        spinnerMsg.text = 'Saving to local config...';
        const mint58 = mintAddress.toBase58();
        const entry: TokenEntry = {
          name,
          symbol,
          preset: presetName,
          network,
          createdAt: new Date().toISOString(),
          keypairPath: keypairPath,
          mintAddress: mint58,
          decimals: parseInt(decimals),
        };
        saveToken(mint58, entry);
        setActiveToken(mint58);

        if (presetName === "sss3") {
          spinnerMsg.text = 'Waiting for deployment confirmation...';
          let freshSdk;
          for (let attempt = 0; attempt < 5; attempt++) {
              try {
                  freshSdk = await SolanaStablecoin.load(network, mintAddress);
                  break;
              } catch {
                  if (attempt === 4) throw new Error('Config PDA not yet visible after deployment');
                  await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              }
          }

          spinnerMsg.text = 'Initializing transfer hook...';
          await freshSdk!.transferHook.initializeHook(authority, authority, true);

          spinnerMsg.text = 'Registering transfer hook account metas...';
          await freshSdk!.transferHook.initializeExtraAccountMetaList(authority, authority);

          spinnerMsg.text = 'Upgrading to SSS-3 (confidential transfers + allowlist)...';
          let auditorArray: Uint8Array | undefined = undefined;
          if (auditor) {
            auditorArray = new Uint8Array(Buffer.from(auditor, 'base64'));
          }
          await freshSdk!.sss3.initialize(authority, {
             auditorPubkey: auditorArray,
             autoApproveNewAccounts: autoApprove || false,
             complianceNote: complianceNote || "Initial Deployment",
          });
        }

        spinnerMsg.stop();

        if (isInteractive) {
          outro(chalk.green("Stablecoin deployed successfully!"));
        }

        printHeader("Stablecoin Created");
        printField("Mint Address", mintAddress.toBase58());
        printField("Preset", presetName.toUpperCase());
        printField("Name", name);
        printField("Symbol", symbol);
        printField("Decimals", decimals);
        printField("Network", network);
        printSuccess("Deployment details", txSig);
        console.log(chalk.gray(`\n  Saved to config & set as active token.`));
      } catch (err) {
        spinnerMsg.fail("Failed to create stablecoin");
        printError("Deployment failed", err);
        process.exit(1);
      }
    });
}

export function registerInfoCommand(program: Command): void {
  program
    .command("info")
    .description("Fetch on-chain info for an existing stablecoin")
    .option("--mint <pubkey>", "Mint address of the stablecoin")
    .option(
      "--network <network>",
      "Network: devnet, mainnet, testnet, localnet",
      "devnet",
    )
    .action(async (opts) => {
      let mintStr = opts.mint;
      let networkName = opts.network;

      if (!mintStr) {
        intro(chalk.bgCyan.black(" Fetch Stablecoin Info "));
        const res = await text({
          message: "Enter the mint address:",
          validate: (value: string | undefined) => {
            if (!value) return "Mint address is required";
            try {
              new PublicKey(value);
            } catch {
              return "Invalid public key";
            }
          },
        });
        if (isCancel(res)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }
        mintStr = res;
      }

      const spinner = ora('Connecting to network...').start();

      try {
        const mint = new PublicKey(mintStr);
        const network = networkName as SolanaNetwork;
        const sdk = await SolanaStablecoin.load(network, mint);

        spinner.text = 'Fetching token info...';
        const info = await sdk.getInfo();

        spinner.stop();
        printHeader("Stablecoin Info");
        printField("Mint", info.mint.toBase58());
        printField("Preset", info.preset.toUpperCase());
        printField("Name", info.name);
        printField("Symbol", info.symbol);
        printField("Total Supply", info.totalSupply);
        printField("Paused", info.paused);
        if (info.blacklistCount !== undefined) {
          printField("Blacklist Count", info.blacklistCount);
        }
        console.log();

        if (!opts.mint) {
          outro(chalk.green("Info retrieved successfully."));
        }
      } catch (err) {
        spinner.fail("Failed to fetch stablecoin info");
        printError("Could not load stablecoin", err);
        process.exit(1);
      }
    });
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List all locally stored tokens")
    .action(() => {
      const config = loadConfig();
      const mints = Object.keys(config.tokens);

      printHeader("Stored Tokens");

      if (mints.length === 0) {
        console.log(
          chalk.gray(
            "  No tokens stored yet. Run sss-token init to get started.",
          ),
        );
        console.log();
        return;
      }

      for (const mint of mints) {
        const t = config.tokens[mint];
        const active =
          mint === config.activeToken ? chalk.green(" (active)") : "";
        console.log(`  ${chalk.cyan(t.symbol)} — ${t.name}${active}`);
        console.log(chalk.gray(`    Mint:    ${mint}`));
        console.log(
          chalk.gray(
            `    Network: ${t.network}  |  Preset: ${t.preset}  |  Decimals: ${t.decimals}`,
          ),
        );
        console.log(chalk.gray(`    Created: ${t.createdAt}`));
        console.log();
      }
    });
}

export function registerUseCommand(program: Command): void {
  program
    .command("use")
    .description("Set a stored token as the active token")
    .argument("[mint]", "Mint address of the token to activate")
    .action(async (mintArg?: string) => {
      const config = loadConfig();
      let mint = mintArg;

      if (!mint) {
        const mints = Object.keys(config.tokens);
        if (mints.length === 0) {
          printError(
            "No tokens stored",
            new Error("Run sss-token init or use --mint with a pubkey."),
          );
          process.exit(1);
        }

        intro(chalk.bgCyan.black(" Switch Active Token "));
        const res = await select({
          message: "Select a token to make active:",
          options: mints.map((m) => ({
            value: m,
            label: `${config.tokens[m].symbol} (${config.tokens[m].name})`,
            hint: m.slice(0, 8) + "...",
          })),
        });

        if (isCancel(res)) {
          cancel("Operation cancelled.");
          process.exit(0);
        }
        mint = res as string;
      }

      if (!config.tokens[mint]) {
        printError(
          "Token not found",
          new Error(
            `No stored token with mint ${mint}.\nRun sss-token list to see available tokens.`,
          ),
        );
        process.exit(1);
      }
      setActiveToken(mint);
      const t = config.tokens[mint];

      if (!mintArg) {
        outro(chalk.green(`Active token set to ${t.symbol}`));
      } else {
        printSuccess(`Active token set to ${t.symbol} (${mint})`);
      }
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
