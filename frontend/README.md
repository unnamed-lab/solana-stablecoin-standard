# Solana Stablecoin Standard (SSS) Frontend

This directory contains the user-facing web frontend for the Solana Stablecoin Standard (SSS) project. It provides an intuitive dashboard for users and operators to interact with SSS tokens.

## Features

- **Token Dashboard**: View circulating supply, mint details, and holder statistics for SSS tokens.
- **Operator Portal**: Interface for authorized roles to perform administrative actions:
  - Minting and Burning tokens
  - Freezing and Thawing accounts
  - Managing roles and authorities
  - SSS-2 Compliance: Managing the blacklist and executing seizures
- **Real-time Updates**: Reflects on-chain changes efficiently.

## Development Setup

This is a Next.js application built with React and Tailwind CSS.

### Prerequisites

- Node.js ≥ 18
- Yarn or NPM

### Installation

```bash
cd frontend
yarn install
```

### Running Locally

Start the Next.js development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

The frontend is built using Next.js App Router and utilizes the `@stbr/sss-token` SDK to construct and send transactions directly to the Solana blockchain. 
