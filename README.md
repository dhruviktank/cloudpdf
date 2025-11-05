# CloudPDF (Vite + React Boilerplate)

This is a minimal starter for the CloudPDF project using Vite + React.

## What you get

- Vite config with React plugin
- Basic `App` with a PDF uploader placeholder
- `package.json` with scripts: `dev`, `build`, `preview`

## Install & run (Windows cmd.exe)

Open a terminal in `c:\\Users\\Dell\\Desktop\\CloudComputing\\cloudpdf` and run:

```bat
npm install
npm run dev
```

Then open http://localhost:5173 if the browser doesn't open automatically.

## Next steps / suggestions

- Add a PDF rendering lib (e.g. `pdfjs-dist`, `react-pdf`) to view uploaded PDFs in-browser.
- Add backend storage or a serverless upload handler for cloud storage.
- Add a linter/formatter and CI pipeline.

## Notes

Run `npm install` to fetch dependencies before running dev server. If you want TypeScript, I can add a TS conversion.
