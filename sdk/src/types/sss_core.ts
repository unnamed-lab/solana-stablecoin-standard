/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sss_core.json`.
 */
export type SssCore = {
  "address": "2Vh56aB6CX2SsHyLVwGQpt8Z9jWqYKNzjf5BXjgM2F5y",
  "metadata": {
    "name": "sssCore",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "acceptAuthorityTransfer",
      "discriminator": [
        239,
        248,
        177,
        2,
        206,
        97,
        46,
        255
      ],
      "accounts": [
        {
          "name": "pendingAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "addMinter",
      "discriminator": [
        75,
        86,
        218,
        40,
        219,
        6,
        141,
        29
      ],
      "accounts": [
        {
          "name": "minterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "minterConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  105,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "minter"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "minter",
          "type": "pubkey"
        },
        {
          "name": "quotaPerPeriod",
          "type": "u64"
        },
        {
          "name": "periodSeconds",
          "type": "i64"
        }
      ]
    },
    {
      "name": "addToAllowlist",
      "discriminator": [
        149,
        143,
        78,
        134,
        241,
        244,
        7,
        56
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "allowlister",
          "signer": true
        },
        {
          "name": "stableConfig",
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "stableConfig"
          ]
        },
        {
          "name": "allowlistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  97,
                  108,
                  108,
                  111,
                  119,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "params.address"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "addToAllowlistParams"
            }
          }
        }
      ]
    },
    {
      "name": "addToBlacklist",
      "discriminator": [
        90,
        115,
        98,
        231,
        173,
        119,
        117,
        176
      ],
      "accounts": [
        {
          "name": "blacklister",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "blacklistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  98,
                  108,
                  97,
                  99,
                  107,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "targetAccount",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "target",
          "type": "pubkey"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "approveConfidentialAccount",
      "discriminator": [
        64,
        146,
        249,
        68,
        150,
        102,
        96,
        140
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "confidentialConfig",
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
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
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
          "name": "tokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "approveProposal",
      "discriminator": [
        136,
        108,
        102,
        85,
        98,
        114,
        7,
        147
      ],
      "accounts": [
        {
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "multisig.mint",
                "account": "multisig"
              }
            ]
          },
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "multisig"
              },
              {
                "kind": "account",
                "path": "proposal.id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "burn",
      "discriminator": [
        116,
        110,
        29,
        56,
        107,
        219,
        42,
        93
      ],
      "accounts": [
        {
          "name": "burner",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "source",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
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
      "name": "cancelProposal",
      "discriminator": [
        106,
        74,
        128,
        146,
        19,
        65,
        39,
        23
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true,
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "multisig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "multisig.mint",
                "account": "multisig"
              }
            ]
          },
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "multisig"
              },
              {
                "kind": "account",
                "path": "proposal.id",
                "account": "proposal"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "createProposal",
      "discriminator": [
        132,
        116,
        68,
        174,
        216,
        160,
        198,
        22
      ],
      "accounts": [
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "multisig.mint",
                "account": "multisig"
              }
            ]
          }
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "multisig"
              },
              {
                "kind": "account",
                "path": "multisig.proposal_nonce",
                "account": "multisig"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "action",
          "type": {
            "defined": {
              "name": "governanceAction"
            }
          }
        }
      ]
    },
    {
      "name": "executeProposal",
      "discriminator": [
        186,
        60,
        116,
        133,
        108,
        128,
        111,
        28
      ],
      "accounts": [
        {
          "name": "executor",
          "writable": true,
          "signer": true
        },
        {
          "name": "multisig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "multisig.mint",
                "account": "multisig"
              }
            ]
          },
          "relations": [
            "proposal"
          ]
        },
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "multisig"
              },
              {
                "kind": "account",
                "path": "proposal.id",
                "account": "proposal"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
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
                "path": "multisig.mint",
                "account": "multisig"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "freezeAccount",
      "discriminator": [
        253,
        75,
        82,
        133,
        167,
        238,
        43,
        130
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
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
            ]
          }
        },
        {
          "name": "account",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "masterAuthority",
          "signer": true
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeParams"
            }
          }
        }
      ]
    },
    {
      "name": "initializeMultisig",
      "discriminator": [
        220,
        130,
        117,
        21,
        27,
        227,
        78,
        213
      ],
      "accounts": [
        {
          "name": "masterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
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
            ]
          }
        },
        {
          "name": "multisig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  117,
                  108,
                  116,
                  105,
                  115,
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
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "signers",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "threshold",
          "type": "u8"
        },
        {
          "name": "timeLockSecs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "initializeSss3",
      "discriminator": [
        2,
        245,
        16,
        64,
        10,
        249,
        110,
        143
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "stableConfig"
          ]
        },
        {
          "name": "stableConfig",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "confidentialConfig",
          "writable": true,
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
                  100,
                  101,
                  110,
                  116,
                  105,
                  97,
                  108
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initializeSss3Params"
            }
          }
        }
      ]
    },
    {
      "name": "mint",
      "discriminator": [
        51,
        57,
        225,
        47,
        182,
        146,
        137,
        166
      ],
      "accounts": [
        {
          "name": "minter",
          "writable": true,
          "signer": true,
          "relations": [
            "minterConfig"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "minterConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  105,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "minter"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config",
            "minterConfig"
          ]
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
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
      "name": "pause",
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47
      ],
      "accounts": [
        {
          "name": "pauser",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "proposeAuthorityTransfer",
      "discriminator": [
        57,
        206,
        225,
        129,
        35,
        111,
        174,
        145
      ],
      "accounts": [
        {
          "name": "masterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeFromAllowlist",
      "discriminator": [
        45,
        46,
        214,
        56,
        189,
        77,
        242,
        227
      ],
      "accounts": [
        {
          "name": "allowlister",
          "signer": true
        },
        {
          "name": "stableConfig",
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "stableConfig"
          ]
        },
        {
          "name": "allowlistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  97,
                  108,
                  108,
                  111,
                  119,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "allowlist_entry.address",
                "account": "allowlistEntry"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "removeFromBlacklist",
      "discriminator": [
        47,
        105,
        20,
        10,
        165,
        168,
        203,
        219
      ],
      "accounts": [
        {
          "name": "blacklister",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "blacklistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  98,
                  108,
                  97,
                  99,
                  107,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "target"
              }
            ]
          }
        },
        {
          "name": "targetAccount",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "target",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "removeMinter",
      "discriminator": [
        241,
        69,
        84,
        16,
        164,
        232,
        131,
        79
      ],
      "accounts": [
        {
          "name": "minterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
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
            ]
          }
        },
        {
          "name": "minterConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  109,
                  105,
                  110,
                  116,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "minter"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "minter",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "seize",
      "discriminator": [
        129,
        159,
        143,
        31,
        161,
        224,
        241,
        84
      ],
      "accounts": [
        {
          "name": "seizer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "seizureRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  115,
                  101,
                  105,
                  122,
                  117,
                  114,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "sourceAccount"
              }
            ]
          }
        },
        {
          "name": "sourceAccount",
          "writable": true
        },
        {
          "name": "destinationAccount",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "reason",
          "type": "string"
        }
      ]
    },
    {
      "name": "setMaxSupply",
      "discriminator": [
        16,
        207,
        140,
        77,
        107,
        20,
        202,
        158
      ],
      "accounts": [
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "stableConfig",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "stableConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newMax",
          "type": "u64"
        }
      ]
    },
    {
      "name": "takeSupplySnapshot",
      "discriminator": [
        74,
        131,
        180,
        187,
        213,
        144,
        180,
        205
      ],
      "accounts": [
        {
          "name": "taker",
          "writable": true,
          "signer": true
        },
        {
          "name": "stableConfig",
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "stableConfig"
          ]
        },
        {
          "name": "snapshot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  115,
                  110,
                  97,
                  112,
                  115,
                  104,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "arg",
                "path": "dayNumber"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "dayNumber",
          "type": "u32"
        }
      ]
    },
    {
      "name": "thawAccount",
      "discriminator": [
        115,
        152,
        79,
        213,
        213,
        169,
        184,
        35
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
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
            ]
          }
        },
        {
          "name": "account",
          "writable": true
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "unpause",
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255
      ],
      "accounts": [
        {
          "name": "masterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "updateAllowlistEntry",
      "discriminator": [
        84,
        46,
        19,
        204,
        154,
        192,
        175,
        152
      ],
      "accounts": [
        {
          "name": "allowlister",
          "signer": true
        },
        {
          "name": "stableConfig",
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "stableConfig"
          ]
        },
        {
          "name": "allowlistEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  115,
                  115,
                  45,
                  97,
                  108,
                  108,
                  111,
                  119,
                  108,
                  105,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              },
              {
                "kind": "account",
                "path": "allowlist_entry.address",
                "account": "allowlistEntry"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "updateAllowlistParams"
            }
          }
        }
      ]
    },
    {
      "name": "updateRoles",
      "discriminator": [
        220,
        152,
        205,
        233,
        177,
        123,
        219,
        125
      ],
      "accounts": [
        {
          "name": "masterAuthority",
          "writable": true,
          "signer": true,
          "relations": [
            "config"
          ]
        },
        {
          "name": "config",
          "writable": true,
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
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "config"
          ]
        }
      ],
      "args": [
        {
          "name": "update",
          "type": {
            "defined": {
              "name": "roleUpdate"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "allowlistEntry",
      "discriminator": [
        42,
        59,
        88,
        1,
        124,
        138,
        92,
        236
      ]
    },
    {
      "name": "blacklistEntry",
      "discriminator": [
        218,
        179,
        231,
        40,
        141,
        25,
        168,
        189
      ]
    },
    {
      "name": "confidentialConfig",
      "discriminator": [
        121,
        207,
        127,
        211,
        92,
        193,
        173,
        135
      ]
    },
    {
      "name": "minterConfig",
      "discriminator": [
        78,
        211,
        23,
        6,
        233,
        19,
        19,
        236
      ]
    },
    {
      "name": "multisig",
      "discriminator": [
        224,
        116,
        121,
        186,
        68,
        161,
        79,
        236
      ]
    },
    {
      "name": "proposal",
      "discriminator": [
        26,
        94,
        189,
        187,
        116,
        136,
        53,
        33
      ]
    },
    {
      "name": "seizureRecord",
      "discriminator": [
        223,
        239,
        19,
        37,
        166,
        60,
        246,
        226
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
    },
    {
      "name": "supplySnapshot",
      "discriminator": [
        230,
        52,
        2,
        192,
        100,
        187,
        34,
        51
      ]
    }
  ],
  "events": [
    {
      "name": "accountFrozenEvent",
      "discriminator": [
        83,
        200,
        223,
        28,
        165,
        34,
        41,
        80
      ]
    },
    {
      "name": "accountThawedEvent",
      "discriminator": [
        172,
        202,
        68,
        155,
        173,
        98,
        79,
        74
      ]
    },
    {
      "name": "allowlistAdded",
      "discriminator": [
        102,
        147,
        146,
        236,
        103,
        153,
        16,
        151
      ]
    },
    {
      "name": "allowlistRemoved",
      "discriminator": [
        47,
        69,
        78,
        173,
        196,
        109,
        163,
        172
      ]
    },
    {
      "name": "blacklisted",
      "discriminator": [
        107,
        52,
        170,
        85,
        201,
        168,
        222,
        152
      ]
    },
    {
      "name": "burned",
      "discriminator": [
        207,
        37,
        251,
        154,
        239,
        229,
        14,
        67
      ]
    },
    {
      "name": "confidentialAccountApproved",
      "discriminator": [
        246,
        206,
        25,
        153,
        83,
        157,
        2,
        182
      ]
    },
    {
      "name": "initialized",
      "discriminator": [
        208,
        213,
        115,
        98,
        115,
        82,
        201,
        209
      ]
    },
    {
      "name": "maxSupplyUpdated",
      "discriminator": [
        227,
        187,
        147,
        191,
        84,
        72,
        203,
        219
      ]
    },
    {
      "name": "minted",
      "discriminator": [
        174,
        131,
        21,
        57,
        88,
        117,
        114,
        121
      ]
    },
    {
      "name": "pausedEvent",
      "discriminator": [
        43,
        14,
        250,
        236,
        116,
        42,
        177,
        89
      ]
    },
    {
      "name": "removedFromBlacklist",
      "discriminator": [
        55,
        136,
        25,
        65,
        199,
        36,
        146,
        33
      ]
    },
    {
      "name": "roleUpdated",
      "discriminator": [
        155,
        222,
        44,
        187,
        5,
        65,
        10,
        212
      ]
    },
    {
      "name": "seized",
      "discriminator": [
        197,
        48,
        203,
        203,
        174,
        37,
        100,
        65
      ]
    },
    {
      "name": "sss3Initialized",
      "discriminator": [
        34,
        153,
        44,
        45,
        67,
        252,
        253,
        60
      ]
    },
    {
      "name": "supplySnapshotTaken",
      "discriminator": [
        199,
        99,
        82,
        185,
        82,
        67,
        13,
        95
      ]
    },
    {
      "name": "unpausedEvent",
      "discriminator": [
        150,
        198,
        191,
        67,
        103,
        86,
        160,
        55
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notMasterAuthority",
      "msg": "Signer is not the master authority"
    },
    {
      "code": 6001,
      "name": "notMinter",
      "msg": "Signer is not authorized to mint"
    },
    {
      "code": 6002,
      "name": "notBurner",
      "msg": "Signer is not authorized to burn"
    },
    {
      "code": 6003,
      "name": "notBlacklister",
      "msg": "Signer is not the blacklister"
    },
    {
      "code": 6004,
      "name": "notSeizer",
      "msg": "Signer is not the seizer"
    },
    {
      "code": 6005,
      "name": "notPauser",
      "msg": "Signer is not the pauser"
    },
    {
      "code": 6006,
      "name": "complianceNotEnabled",
      "msg": "Compliance module not enabled. Initialize with enable_transfer_hook: true for SSS-2"
    },
    {
      "code": 6007,
      "name": "permanentDelegateNotEnabled",
      "msg": "Permanent delegate not enabled. Initialize with enable_permanent_delegate: true for SSS-2"
    },
    {
      "code": 6008,
      "name": "hookNotRegistered",
      "msg": "Transfer hook not registered on this stablecoin"
    },
    {
      "code": 6009,
      "name": "paused",
      "msg": "Stablecoin is paused"
    },
    {
      "code": 6010,
      "name": "notPaused",
      "msg": "Stablecoin is not paused"
    },
    {
      "code": 6011,
      "name": "alreadyBlacklisted",
      "msg": "Address is already blacklisted"
    },
    {
      "code": 6012,
      "name": "notBlacklisted",
      "msg": "Address is not blacklisted"
    },
    {
      "code": 6013,
      "name": "invalidBlacklistTarget",
      "msg": "Cannot blacklist the zero address"
    },
    {
      "code": 6014,
      "name": "accountNotFrozen",
      "msg": "Cannot seize from a non-frozen account"
    },
    {
      "code": 6015,
      "name": "quotaExceeded",
      "msg": "Mint amount exceeds per-period quota"
    },
    {
      "code": 6016,
      "name": "minterInactive",
      "msg": "Minter is inactive"
    },
    {
      "code": 6017,
      "name": "minterAlreadyExists",
      "msg": "Minter config already exists"
    },
    {
      "code": 6018,
      "name": "noPendingTransfer",
      "msg": "No pending authority transfer"
    },
    {
      "code": 6019,
      "name": "notPendingAuthority",
      "msg": "Signer is not the pending authority"
    },
    {
      "code": 6020,
      "name": "nameTooLong",
      "msg": "Name exceeds 32 characters"
    },
    {
      "code": 6021,
      "name": "symbolTooLong",
      "msg": "Symbol exceeds 10 characters"
    },
    {
      "code": 6022,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6023,
      "name": "supplyOverflow",
      "msg": "Overflow in supply calculation"
    },
    {
      "code": 6024,
      "name": "senderNotAllowed",
      "msg": "Sender is not on the allowlist — SSS-3 requires explicit allowlist membership to send"
    },
    {
      "code": 6025,
      "name": "recipientNotAllowed",
      "msg": "Recipient is not on the allowlist — SSS-3 requires explicit allowlist membership to receive"
    },
    {
      "code": 6026,
      "name": "allowlistEntryExpired",
      "msg": "Allowlist entry has expired — request renewal from the issuer"
    },
    {
      "code": 6027,
      "name": "sendPermissionDenied",
      "msg": "Sender's allowlist entry does not grant SEND permission"
    },
    {
      "code": 6028,
      "name": "receivePermissionDenied",
      "msg": "Recipient's allowlist entry does not grant RECEIVE permission"
    },
    {
      "code": 6029,
      "name": "alreadyAllowlisted",
      "msg": "Address is already on the allowlist"
    },
    {
      "code": 6030,
      "name": "notOnAllowlist",
      "msg": "Address is not on the allowlist — cannot remove what doesn't exist"
    },
    {
      "code": 6031,
      "name": "confidentialNotEnabled",
      "msg": "Confidential transfers are not enabled on this mint"
    },
    {
      "code": 6032,
      "name": "confidentialAlreadyInitialized",
      "msg": "Confidential config already initialized for this mint"
    },
    {
      "code": 6033,
      "name": "autoApproveDisabled",
      "msg": "Auto-approve is disabled — authority must call approve_confidential_account first"
    },
    {
      "code": 6034,
      "name": "accountNotApproved",
      "msg": "Confidential token account has not been approved for confidential transfers"
    },
    {
      "code": 6035,
      "name": "invalidAuditorKey",
      "msg": "Auditor ElGamal pubkey is not 64 bytes — check key format"
    },
    {
      "code": 6036,
      "name": "maxSupplyExceeded",
      "msg": "Mint would exceed the configured max_supply cap"
    },
    {
      "code": 6037,
      "name": "maxSupplyBelowCurrentSupply",
      "msg": "New max supply cannot be less than the current total supply"
    },
    {
      "code": 6038,
      "name": "allowlistNotActive",
      "msg": "Allowlist mode is not active on this mint — this instruction requires SSS-3"
    },
    {
      "code": 6039,
      "name": "cannotDisableAllowlist",
      "msg": "Cannot disable allowlist mode once active — security invariant"
    },
    {
      "code": 6040,
      "name": "requiresSss2Preset",
      "msg": "Cannot initialize SSS-3 on a non-SSS-2 mint — upgrade to SSS-2 first"
    },
    {
      "code": 6041,
      "name": "snapshotAlreadyTaken",
      "msg": "A supply snapshot has already been taken for today — one per day maximum"
    },
    {
      "code": 6042,
      "name": "multisigAlreadyInitialized",
      "msg": "Multisig already initialized for this mint"
    },
    {
      "code": 6043,
      "name": "invalidThreshold",
      "msg": "Invalid multisig threshold — must be > 0 and <= number of signers"
    },
    {
      "code": 6044,
      "name": "signerNotMultisigMember",
      "msg": "Signer is not a member of the multisig"
    },
    {
      "code": 6045,
      "name": "duplicateApproval",
      "msg": "Signer has already approved this proposal"
    },
    {
      "code": 6046,
      "name": "proposalAlreadyExecuted",
      "msg": "Proposal has already been executed"
    },
    {
      "code": 6047,
      "name": "proposalCancelled",
      "msg": "Proposal has been cancelled"
    },
    {
      "code": 6048,
      "name": "thresholdNotMet",
      "msg": "Proposal is not approved — threshold not met"
    },
    {
      "code": 6049,
      "name": "proposalTimeLockNotMatured",
      "msg": "Proposal time-lock has not matured yet"
    },
    {
      "code": 6050,
      "name": "directExecutionBlockedByMultisig",
      "msg": "Direct execution blocked — SSS-3 Multisig is active, action must go through a proposal"
    }
  ],
  "types": [
    {
      "name": "accountFrozenEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "account",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "accountThawedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "account",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "addToAllowlistParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "allowedOperations",
            "type": "u8"
          },
          {
            "name": "kycTier",
            "type": "u8"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "reason",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "allowlistAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "allowedOperations",
            "type": "u8"
          },
          {
            "name": "kycTier",
            "type": "u8"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "addedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "allowlistEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "The SSS token mint this entry is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "address",
            "docs": [
              "The wallet address being allowlisted"
            ],
            "type": "pubkey"
          },
          {
            "name": "allowedOperations",
            "docs": [
              "Bitmask of permitted operations — see allowlist_ops",
              "0x01 = receive, 0x02 = send, 0x03 = both"
            ],
            "type": "u8"
          },
          {
            "name": "kycTier",
            "docs": [
              "KYC tier (application-level metadata, not enforced by program)",
              "0 = basic, 1 = enhanced (EDD), 2 = institutional"
            ],
            "type": "u8"
          },
          {
            "name": "expiry",
            "docs": [
              "Optional expiry timestamp.",
              "0 = never expires",
              "If current time > expiry: hook rejects the transfer"
            ],
            "type": "i64"
          },
          {
            "name": "addedBy",
            "docs": [
              "Who added this entry"
            ],
            "type": "pubkey"
          },
          {
            "name": "addedAt",
            "docs": [
              "Timestamp this entry was added"
            ],
            "type": "i64"
          },
          {
            "name": "reason",
            "docs": [
              "Reason for allowlisting (audit trail)"
            ],
            "type": "string"
          },
          {
            "name": "active",
            "docs": [
              "Whether this entry is active.",
              "Soft-delete: set to false rather than closing the account."
            ],
            "type": "bool"
          },
          {
            "name": "removedBy",
            "docs": [
              "If active=false, who removed it"
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "removedAt",
            "docs": [
              "If active=false, when it was removed"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "allowlistRemoved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "removedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "blacklistEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "addedBy",
            "type": "pubkey"
          },
          {
            "name": "addedAt",
            "type": "i64"
          },
          {
            "name": "removed",
            "type": "bool"
          },
          {
            "name": "removedBy",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "removedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "blacklisted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "blacklistedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "burned",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "from",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "burner",
            "type": "pubkey"
          },
          {
            "name": "newTotalSupply",
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
      "name": "confidentialAccountApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "tokenAccount",
            "type": "pubkey"
          },
          {
            "name": "approvedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "confidentialConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "Schema version — increment if structure changes"
            ],
            "type": "u8"
          },
          {
            "name": "mint",
            "docs": [
              "The SSS token mint this confidential config is for"
            ],
            "type": "pubkey"
          },
          {
            "name": "authority",
            "docs": [
              "Authority that can update this config (same as StablecoinConfig.master_authority)"
            ],
            "type": "pubkey"
          },
          {
            "name": "auditorElgamalPubkey",
            "docs": [
              "ElGamal public key of the auditor.",
              "The holder of the corresponding private key can decrypt ALL ciphertext",
              "balances and transfer amounts on this mint.",
              "",
              "SECURITY: Treat this key material with HSM-level protection.",
              "If None: no auditor — fully private (not recommended for regulated tokens)",
              "If Some: auditor can see all amounts — compliant but privacy-limited",
              "",
              "Stored as 64 raw bytes (the compressed ElGamal pubkey format used by",
              "Token-2022's ConfidentialTransferMint extension)"
            ],
            "type": {
              "option": {
                "array": [
                  "u8",
                  64
                ]
              }
            }
          },
          {
            "name": "autoApproveNewAccounts",
            "docs": [
              "If true: any wallet can self-configure their ATA for confidential use.",
              "If false: the authority must explicitly call approve_confidential_account.",
              "",
              "For regulated stablecoins: MUST be false."
            ],
            "type": "bool"
          },
          {
            "name": "complianceNote",
            "docs": [
              "Human-readable note about the compliance/auditing arrangement.",
              "e.g. \"Auditor key held by XYZ Law Firm under data protection agreement\""
            ],
            "type": "string"
          },
          {
            "name": "enabledAt",
            "docs": [
              "Timestamp when confidential mode was enabled"
            ],
            "type": "i64"
          },
          {
            "name": "enabledBy",
            "docs": [
              "Who enabled confidential mode"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalConfidentialTransfers",
            "docs": [
              "Cumulative count of confidential transfer operations"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "governanceAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mintTo",
            "fields": [
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "to",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "seize",
            "fields": [
              {
                "name": "amount",
                "type": "u64"
              },
              {
                "name": "from",
                "type": "pubkey"
              },
              {
                "name": "to",
                "type": "pubkey"
              }
            ]
          },
          {
            "name": "updateRoles",
            "fields": [
              {
                "name": "newMasterAuthority",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newPauser",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newMinterAuthority",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newBurner",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newBlacklister",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newSeizer",
                "type": {
                  "option": "pubkey"
                }
              },
              {
                "name": "newHookAuthority",
                "type": {
                  "option": "pubkey"
                }
              }
            ]
          },
          {
            "name": "delegateToDao",
            "fields": [
              {
                "name": "programId",
                "type": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "initializeParams",
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "preset",
            "type": {
              "defined": {
                "name": "stablecoinPreset"
              }
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
            "name": "hookProgramId",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "initializeSss3Params",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "auditorElgamalPubkey",
            "type": {
              "option": {
                "array": [
                  "u8",
                  64
                ]
              }
            }
          },
          {
            "name": "autoApproveNewAccounts",
            "type": "bool"
          },
          {
            "name": "complianceNote",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "initialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "preset",
            "type": "string"
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
            "name": "decimals",
            "type": "u8"
          },
          {
            "name": "masterAuthority",
            "type": "pubkey"
          },
          {
            "name": "complianceEnabled",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "maxSupplyUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "oldMax",
            "type": "u64"
          },
          {
            "name": "newMax",
            "type": "u64"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "minted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "minter",
            "type": "pubkey"
          },
          {
            "name": "newTotalSupply",
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
      "name": "minterConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "minter",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "quotaPerPeriod",
            "type": "u64"
          },
          {
            "name": "periodSeconds",
            "type": "i64"
          },
          {
            "name": "mintedThisPeriod",
            "type": "u64"
          },
          {
            "name": "periodStart",
            "type": "i64"
          },
          {
            "name": "totalMinted",
            "type": "u64"
          },
          {
            "name": "mintCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "multisig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "signers",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "threshold",
            "type": "u8"
          },
          {
            "name": "timeLockSecs",
            "type": "i64"
          },
          {
            "name": "proposalNonce",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pausedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "proposal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "multisig",
            "type": "pubkey"
          },
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "action",
            "type": {
              "defined": {
                "name": "governanceAction"
              }
            }
          },
          {
            "name": "approvals",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "proposedAt",
            "type": "i64"
          },
          {
            "name": "eta",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "removedFromBlacklist",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "removedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "roleUpdate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newPauser",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newMinterAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newBurner",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newBlacklister",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "newSeizer",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "roleUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": "string"
          },
          {
            "name": "oldAddress",
            "type": "pubkey"
          },
          {
            "name": "newAddress",
            "type": "pubkey"
          },
          {
            "name": "updatedBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "seized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "seizedFrom",
            "type": "pubkey"
          },
          {
            "name": "seizedTo",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "seizer",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "seizureRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "seizedFrom",
            "type": "pubkey"
          },
          {
            "name": "seizedTo",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "string"
          },
          {
            "name": "executedBy",
            "type": "pubkey"
          },
          {
            "name": "executedAt",
            "type": "i64"
          },
          {
            "name": "transactionSignature",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "sss3Initialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "autoApprove",
            "type": "bool"
          },
          {
            "name": "hasAuditor",
            "type": "bool"
          },
          {
            "name": "allowlistActive",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
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
      "name": "supplySnapshot",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "dayNumber",
            "type": "u32"
          },
          {
            "name": "supply",
            "type": "u64"
          },
          {
            "name": "minterCount",
            "type": "u32"
          },
          {
            "name": "takenBy",
            "type": "pubkey"
          },
          {
            "name": "takenAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "supplySnapshotTaken",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "dayNumber",
            "type": "u32"
          },
          {
            "name": "supply",
            "type": "u64"
          },
          {
            "name": "takenBy",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "unpausedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "by",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "updateAllowlistParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "allowedOperations",
            "type": "u8"
          },
          {
            "name": "kycTier",
            "type": "u8"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "reason",
            "type": "string"
          }
        ]
      }
    }
  ]
};
