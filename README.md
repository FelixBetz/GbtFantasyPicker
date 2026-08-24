# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.16.1 create --template minimal --types ts --add prettier eslint tailwindcss="plugins:typography,forms" sveltekit-adapter="adapter:vercel" --install npm gbt-fantasy-picker
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## DVV Seed List Extraction

Use the extraction script to read names from a DVV list link and write them directly into a generated source file:

```sh
npm run extract:dvv -- https://beach.volleyball-verband.de/public/tur-ml.php?id=14667
```

Notes:

- The script normalizes `tur-ml.php` to `tur-sl.php` (setzliste).
- Men are loaded automatically via `id + 1`.
- Output includes player names from the linked team/player profiles.
- Bracket mode suggestion is automatic from team count.
- `16` teams -> `gbc-final`.
- Otherwise -> `tourstop`.

Optional flags:

```sh
npm run extract:dvv -- <url> --json
npm run extract:dvv -- <url> --svelte
npm run extract:dvv -- <url> --write
npm run extract:dvv -- <url> --write=src/data/players.generated.ts
```

By default, output is written to `src/data/players.generated.ts`.
`--write` and `--write-file=<path>` let you choose another target file.
