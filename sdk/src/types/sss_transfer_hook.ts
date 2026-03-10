/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_transfer_hook.json`.
 */
export type SssTransferHook = {
  "address": "rb1x3TyqYSWAE5JtLnZm4yAvvsLNaHZWMF2YiD3kB75",
  "metadata": {
    "name": "sssTransferHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "disableHook",
      "discriminator": [
        135,
        250,
        78,
        138,
        213,
        16,
        28,
        219
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "hook_config.mint",
                "account": "hookConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "enableHook",
      "discriminator": [
        242,
        81,
        117,
        14,
        86,
        35,
        185,
        143
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "hook_config.mint",
                "account": "hookConfig"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "execute",
      "discriminator": [
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "source"
        },
        {
          "name": "mint"
        },
        {
          "name": "destination"
        },
        {
          "name": "sourceAuthority"
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "sssCoreProgram"
        },
        {
          "name": "senderBlacklistEntry"
        },
        {
          "name": "recipientBlacklistEntry"
        },
        {
          "name": "senderAllowlistEntry"
        },
        {
          "name": "recipientAllowlistEntry"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeExtraAccountMetaList",
      "discriminator": [
        92,
        197,
        174,
        197,
        41,
        124,
        19,
        3
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "hookConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializeHook",
      "discriminator": [
        37,
        101,
        119,
        255,
        156,
        39,
        252,
        232
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "sssConfig"
          ]
        },
        {
          "name": "sssConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                231,
                124,
                128,
                90,
                186,
                127,
                233,
                120,
                162,
                44,
                243,
                185,
                203,
                162,
                55,
                222,
                155,
                47,
                85,
                118,
                12,
                254,
                122,
                145,
                121,
                68,
                94,
                153,
                136,
                215,
                39,
                237
              ]
            }
          }
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "defaultEnabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "setAllowlistMode",
      "docs": [
        "SSS-3: Enable or disable allowlist mode on the hook.",
        "Called by the authority after initialize_sss3 on sss-core."
      ],
      "discriminator": [
        3,
        97,
        85,
        153,
        186,
        48,
        32,
        191
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "hookConfig"
          ]
        },
        {
          "name": "hookConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  111,
                  107,
                  45,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "hook_config.mint",
                "account": "hookConfig"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "hookConfig",
      "discriminator": [
        137,
        155,
        101,
        95,
        138,
        72,
        8,
        182
      ]
    },
    {
      "name": "stablecoinConfig",
      "discriminator": [
        127,
        25,
        244,
        213,
        1,
        192,
        101,
        6
      ]
    }
  ],
  "events": [
    {
      "name": "transferBlocked",
      "discriminator": [
        209,
        54,
        14,
        64,
        139,
        238,
        231,
        236
      ]
    },
    {
      "name": "transferValidated",
      "discriminator": [
        171,
        133,
        176,
        35,
        131,
        74,
        31,
        221
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "senderBlacklisted",
      "msg": "Sender is blacklisted and cannot transfer tokens"
    },
    {
      "code": 6001,
      "name": "recipientBlacklisted",
      "msg": "Recipient is blacklisted and cannot receive tokens"
    },
    {
      "code": 6002,
      "name": "hookDisabled",
      "msg": "Transfer hook is disabled"
    },
    {
      "code": 6003,
      "name": "invalidMint",
      "msg": "Invalid mint for this hook instance"
    },
    {
      "code": 6004,
      "name": "invalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6005,
      "name": "senderNotAllowlisted",
      "msg": "Sender is not on the allowlist — SSS-3 requires explicit allowlist membership to send"
    },
    {
      "code": 6006,
      "name": "recipientNotAllowlisted",
      "msg": "Recipient is not on the allowlist — SSS-3 requires explicit allowlist membership to receive"
    }
  ],
  "types": [
    {
      "name": "hookConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "sssCoreProgram",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "transferCount",
            "type": "u64"
          },
          {
            "name": "blockedCount",
            "type": "u64"
          },
          {
            "name": "allowlistMode",
            "docs": [
              "SSS-3: When true, enforces allowlist checking in addition to blacklist.",
              "Default false for SSS-2 mints. Set to true when SSS-3 is initialized."
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stablecoinConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "preset",
            "type": {
              "defined": {
                "name": "stablecoinPreset"
              }
            }
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "enablePermanentDelegate",
            "type": "bool"
          },
          {
            "name": "enableTransferHook",
            "type": "bool"
          },
          {
            "name": "defaultAccountFrozen",
            "type": "bool"
          },
          {
            "name": "masterAuthority",
            "type": "pubkey"
          },
          {
            "name": "pendingMasterAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "pauser",
            "type": "pubkey"
          },
          {
            "name": "minterAuthority",
            "type": "pubkey"
          },
          {
            "name": "burner",
            "type": "pubkey"
          },
          {
            "name": "blacklister",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "seizer",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "hookAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "totalSupply",
            "type": "u64"
          },
          {
            "name": "totalMintedAllTime",
            "type": "u64"
          },
          {
            "name": "totalBurnedAllTime",
            "type": "u64"
          },
          {
            "name": "blacklistCount",
            "type": "u32"
          },
          {
            "name": "hookProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "lastUpdatedAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "maxSupply",
            "docs": [
              "Maximum token supply. 0 = unlimited.",
              "Enforced in mint instruction: current_supply + amount <= max_supply (if > 0)"
            ],
            "type": "u64"
          },
          {
            "name": "totalMintOperations",
            "docs": [
              "Total number of successful mint operations (operation count, not amount)"
            ],
            "type": "u64"
          },
          {
            "name": "totalBurnOperations",
            "docs": [
              "Total number of successful burn operations"
            ],
            "type": "u64"
          },
          {
            "name": "largestSingleMint",
            "docs": [
              "Largest single mint amount ever (in token base units)"
            ],
            "type": "u64"
          },
          {
            "name": "lastMintAt",
            "docs": [
              "Timestamp of the most recent mint operation"
            ],
            "type": "i64"
          },
          {
            "name": "lastBurnAt",
            "docs": [
              "Timestamp of the most recent burn operation"
            ],
            "type": "i64"
          },
          {
            "name": "confidentialTransfersEnabled",
            "docs": [
              "Whether confidential transfers are enabled on this mint"
            ],
            "type": "bool"
          },
          {
            "name": "allowlistActive",
            "docs": [
              "Whether scoped allowlist enforcement is active.",
              "false = SSS-1/SSS-2 (blacklist model), true = SSS-3 (allowlist model)"
            ],
            "type": "bool"
          },
          {
            "name": "allowlistCount",
            "docs": [
              "Count of active allowlist entries (for dashboard display)"
            ],
            "type": "u32"
          },
          {
            "name": "minterCount",
            "docs": [
              "Count of active minters"
            ],
            "type": "u32"
          },
          {
            "name": "multisigEnabled",
            "docs": [
              "Whether SSS-3 Multisig governance is enabled"
            ],
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "stablecoinPreset",
      "repr": {
        "kind": "rust"
      },
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sss1"
          },
          {
            "name": "sss2"
          },
          {
            "name": "custom"
          },
          {
            "name": "sss3"
          }
        ]
      }
    },
    {
      "name": "transferBlocked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "blockedAddress",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "transferValidated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "source",
            "type": "pubkey"
          },
          {
            "name": "destination",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
