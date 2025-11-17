# Development Guide

This guide is for developers who want to contribute to or modify the srt2fcpx project.

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher

## Project Structure

This project uses pnpm workspaces as a monorepo:

```
srt2fcpx/
├── packages/
│   ├── core/           # Core library (@srt2fcpx/core)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── index.spec.ts
│   │   │   ├── srt/
│   │   │   │   ├── parser.ts
│   │   │   │   └── parser.spec.ts
│   │   │   ├── fcpxml/
│   │   │   │   ├── builder.ts
│   │   │   │   └── builder.spec.ts
│   │   │   └── fixtures/
│   │   │       ├── base-template.fcpxml
│   │   │       └── title-template.xml
│   │   └── dist/
│   └── cli/            # CLI tool (@srt2fcpx/cli)
│       ├── src/
│       │   └── cli.ts
│       └── dist/
└── examples/           # Examples and scripts
    ├── input/          # Sample SRT files
    ├── output/         # Generated FCPXML files (gitignored)
    ├── convert.mjs
    └── README.md
```

## Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Testing the CLI Locally

### Method 1: Using pnpm scripts (recommended)

```bash
# From project root
pnpm srt2fcpx examples/input/sample.srt
pnpm srt2fcpx examples/input/sample.srt -t "My Project" -f 30
```

### Method 2: Direct execution with relative path

```bash
cd examples
node convert.mjs input/sample.srt
# or
../packages/cli/dist/cli.js input/sample.srt
```

### Method 3: Via npx (after build)

```bash
npx @srt2fcpx/cli examples/input/sample.srt
```

## Global Installation (Production)

During development, avoid using `pnpm link --global` and use the local execution methods above.

For production or end-user distribution after publishing:

```bash
# After publishing the package
npm install -g @srt2fcpx/cli

# Then use anywhere
srt2fcpx input.srt
```

## Testing

```bash
# Run tests for all packages
pnpm test

# Core package only
cd packages/core
pnpm test

# Watch mode
pnpm test:watch
```

All 88 tests should pass.

## Package Scripts

### Root workspace

- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm srt2fcpx` - Run CLI from local build

### Core package (`packages/core`)

- `pnpm build` - Build TypeScript to dist/
- `pnpm test` - Run unit tests with Vitest
- `pnpm test:watch` - Run tests in watch mode

### CLI package (`packages/cli`)

- `pnpm build` - Build CLI tool
- `pnpm test` - Run CLI tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Build: `pnpm build`
6. Submit a pull request

## Release Process

This project uses Changesets for automated version management and publishing.

See [RELEASING.md](./RELEASING.md) for detailed release instructions.

### Quick Release Steps

1. Create a changeset: `pnpm changeset`
2. Commit and push to a branch
3. Create PR and merge to `main`
4. GitHub Actions will create a "Release" PR
5. Merge the "Release" PR to publish to npm
