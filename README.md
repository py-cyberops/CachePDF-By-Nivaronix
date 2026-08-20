# CachePDF by Nivaronix

CachePDF is a browser-first PDF workbench. Supported document operations run locally in the visitor’s browser; files are not sent to CachePDF for the supported processing workflows.

## Key capabilities

CachePDF includes local PDF organization, page editing, OCR and searchable-PDF generation, signing, metadata/privacy inspection, and a quality-first compression workflow. Compression defaults to lossless optimization. A lossy JPEG-raster option is available only after explicit confirmation and provides a local before-export comparison.

## Local development

Use Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

## Validation and production build

```bash
pnpm check
pnpm test
pnpm test:invariants
pnpm build
pnpm start
```

`pnpm build` creates the client build, pre-renders the public SEO routes using the canonical domain, and bundles the Node server into `dist/`. `pnpm start` runs the production server without a hard-coded port.

## Deployment and domain

The canonical production origin is `https://cachepdf.nivaronix.com`. Deploy the repository to a Node-compatible host using the build command `pnpm build` and start command `pnpm start`. In Cloudflare DNS, point the `cachepdf` host at the selected hosting provider according to its required CNAME or A/AAAA record. Enable HTTPS at the host and use Cloudflare Full (strict) SSL once a valid origin certificate is active.

Do not commit `.env` files or credential values. The platform-provided environment configuration used by the application must be set in the deployment provider.

## License

MIT
