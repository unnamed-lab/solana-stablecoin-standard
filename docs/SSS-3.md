# SSS-3: Governance

The **SSS-3** preset introduces a native on-chain governance setup to manage administrative operations through a multi-signature wallet. This fully integrates security constraints to guard the operation of the stablecoin while retaining compliance hooks.

## Features

- **Native Multi-sig**: Lightweight, embedded multi-sig capabilities directly within `sss-core`, requiring M-of-N signers.
- **Strict Execution Blocking**: Once multi-sig is enabled, direct administrative calls to operations like Mint, Seize, and Role Updates are strictly rejected.
- **DAO Integration**: Support to delegate operations directly to external DAO frameworks like SPL Governance.
- **Time-locks**: Supports configurable time-locks on proposals to ensure actions can be reviewed before execution.
- **Inherits SSS-2**: Full inheritance of all SSS-2 compliance engine features (Transfer Hooks, Permanent Delegates).
