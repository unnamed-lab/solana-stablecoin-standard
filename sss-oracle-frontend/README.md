# SSS Oracle Frontend

This directory contains a web frontend specifically designed for the SSS Oracle application. It interfaces with the backend oracle to fetch and display token prices, simulate mint/redeem quotes, and manage data feeds.

## Development Setup

This is a Next.js application.

### Prerequisites

- Node.js ≥ 18
- Yarn or NPM

### Installation

```bash
cd sss-oracle-frontend
yarn install
```

### Running Locally

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- Price simulation interface connecting to the NestJS Oracle backend.
- Integrates visually with Switchboard or Pyth price feeds as defined by the SSS Oracle configuration.
