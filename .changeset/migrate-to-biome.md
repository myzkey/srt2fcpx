---
'srt2fcpx': patch
---

Migrate from ESLint to Biome and improve tooling

- Replace ESLint + Prettier with Biome for faster linting and formatting
- Configure code style: single quotes, minimal semicolons, 2-space indent
- Fix standalone bundle fixtures path resolution
- Upgrade GitHub Actions to use setup-node@v5 for reliable npm publishing
- Remove all ESLint dependencies and configuration
