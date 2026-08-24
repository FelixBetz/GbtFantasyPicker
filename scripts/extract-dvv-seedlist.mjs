#!/usr/bin/env node

import process from 'node:process';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const DEFAULT_OUTPUT_FILE = 'src/data/players.generated.ts';

const HELP_TEXT = `Usage:
  npm run extract:dvv -- <dvv-link>

Examples:
  npm run extract:dvv -- https://beach.volleyball-verband.de/public/tur-ml.php?id=14667
  npm run extract:dvv -- https://beach.volleyball-verband.de/public/tur-sl.php?id=14642 --json
  npm run extract:dvv -- https://beach.volleyball-verband.de/public/tur-sl.php?id=14642 --svelte

Behavior:
  - Uses the given link as women tournament reference.
  - Automatically uses men id = women id + 1.
  - If the passed link is already men, women id is inferred as men id - 1.
  - If path is tur-ml.php, it is normalized to tur-sl.php (setzliste).

Flags:
  --json     Print JSON only.
  --svelte   Print Svelte Player lines only.
  --write    Write extracted players into a TypeScript file.
             Optional path: --write=src/data/players.generated.ts
  --write-file <path>
             Explicit output path.
  -h, --help Show this help.
`;

function parseArgs(argv) {
  const args = argv.slice(2);
  const positional = [];
  const npmJsonFlag = process.env.npm_config_json === 'true';
  const npmSvelteFlag = process.env.npm_config_svelte === 'true';
  const npmWriteFlag = process.env.npm_config_write === 'true';
  const npmWriteFileFlag = process.env.npm_config_write_file;
  let writeToFile = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--write' || arg === '--write-file') {
      const nextArg = args[index + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        writeToFile = nextArg;
        index += 1;
      } else {
        writeToFile = DEFAULT_OUTPUT_FILE;
      }

      continue;
    }

    if (arg.startsWith('--write=')) {
      writeToFile = arg.slice('--write='.length) || DEFAULT_OUTPUT_FILE;
      continue;
    }

    if (arg.startsWith('--write-file=')) {
      writeToFile = arg.slice('--write-file='.length) || DEFAULT_OUTPUT_FILE;
      continue;
    }

    positional.push(arg);
  }

  if (positional.includes('-h') || positional.includes('--help')) {
    return { help: true, inputUrl: null, mode: 'summary', writeToFile: null };
  }

  const mode =
    positional.includes('--json') || npmJsonFlag
      ? 'json'
      : positional.includes('--svelte') || npmSvelteFlag
        ? 'svelte'
        : 'summary';
  const inputUrl = positional.find((arg) => !arg.startsWith('-')) ?? null;

  if (!writeToFile && npmWriteFlag) {
    writeToFile = DEFAULT_OUTPUT_FILE;
  }

  if (!writeToFile && typeof npmWriteFileFlag === 'string' && npmWriteFileFlag.trim()) {
    writeToFile = npmWriteFileFlag.trim();
  }

  if (!writeToFile && mode === 'svelte') {
    writeToFile = DEFAULT_OUTPUT_FILE;
  }

  if (!writeToFile) {
    writeToFile = DEFAULT_OUTPUT_FILE;
  }

  return { help: false, inputUrl, mode, writeToFile };
}

function decodeHtml(value) {
  const entityMap = {
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&ouml;': 'ö',
    '&Ouml;': 'Ö',
    '&auml;': 'ä',
    '&Auml;': 'Ä',
    '&szlig;': 'ß'
  };

  return value.replace(/&(?:amp|quot|#39|apos|lt|gt|nbsp|uuml|Uuml|ouml|Ouml|auml|Auml|szlig);/g, (m) => entityMap[m] ?? m)
    .replace(/&#(\d+);/g, (_match, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hexCodePoint) => String.fromCodePoint(Number.parseInt(hexCodePoint, 16)));
}

function stripTags(value) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function parseTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? stripTags(titleMatch[1]) : '';
}

function toSetzlisteUrl(inputUrl) {
  const normalizedUrl = new URL(inputUrl);
  const fileName = normalizedUrl.pathname.split('/').pop() ?? '';
  const tournamentPagePattern = /^tur(?:-(?:sl|ml|show|zu|sp|info|er))?\.php$/i;

  if (tournamentPagePattern.test(fileName)) {
    const segments = normalizedUrl.pathname.split('/');
    segments[segments.length - 1] = 'tur-sl.php';
    normalizedUrl.pathname = segments.join('/');
    return normalizedUrl;
  }

  if (normalizedUrl.searchParams.has('id')) {
    normalizedUrl.pathname = '/public/tur-sl.php';
  }

  return normalizedUrl;
}

function readTournamentId(url) {
  const value = url.searchParams.get('id');

  if (!value) {
    throw new Error('The provided URL has no id query parameter.');
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Invalid tournament id: ${value}`);
  }

  return id;
}

function withTournamentId(baseUrl, id) {
  const nextUrl = new URL(baseUrl.toString());
  nextUrl.searchParams.set('id', String(id));
  return nextUrl;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'gbt-fantasy-picker/1.0 (+https://github.com)'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

function extractRows(html) {
  return [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1]);
}

function extractCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => match[1]);
}

function parseSeed(value) {
  const clean = stripTags(value);
  const match = clean.match(/^(\d{1,2})\b/);
  return match ? Number(match[1]) : null;
}

function toAbsoluteUrl(href, baseUrl) {
  return new URL(decodeHtml(href), baseUrl).toString();
}

function extractSeedTeams(listHtml, listUrl) {
  const rows = extractRows(listHtml);
  const collected = [];

  for (const row of rows) {
    const cells = extractCells(row);

    if (cells.length < 2) {
      continue;
    }

    const seed = parseSeed(cells[0]);

    if (!seed) {
      continue;
    }

    const teamLinkMatch = cells
      .slice(1)
      .join(' ')
      .match(/<a\b[^>]*href=["']([^"']*team\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);

    if (!teamLinkMatch) {
      continue;
    }

    collected.push({
      seed,
      teamLabel: stripTags(teamLinkMatch[2]),
      teamUrl: toAbsoluteUrl(teamLinkMatch[1], listUrl)
    });
  }

  const bySeed = new Map();

  for (const team of collected) {
    if (!bySeed.has(team.seed)) {
      bySeed.set(team.seed, team);
    }
  }

  return [...bySeed.values()].sort((a, b) => a.seed - b.seed);
}

function parsePlayerLabel(label) {
  const clean = stripTags(label);
  const parts = clean.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(', ')
    };
  }

  return {
    firstName: '',
    lastName: clean
  };
}

function extractTeamPlayers(teamHtml, teamUrl, teamLabel) {
  const playerLinkMatches = [...teamHtml.matchAll(/<a\b[^>]*href=["']([^"']*spieler\.php\?id=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const players = [];
  const seenProfiles = new Set();

  for (const match of playerLinkMatches) {
    const profileUrl = toAbsoluteUrl(match[1], teamUrl);

    if (seenProfiles.has(profileUrl)) {
      continue;
    }

    seenProfiles.add(profileUrl);

    const parsed = parsePlayerLabel(match[2]);

    if (!parsed.lastName) {
      continue;
    }

    players.push({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      profileUrl
    });

    if (players.length === 2) {
      break;
    }
  }

  if (players.length === 2) {
    return players;
  }

  const fallbackLastNames = teamLabel
    .split('-')
    .map((part) => part.trim())
    .filter(Boolean);

  while (players.length < 2) {
    players.push({
      firstName: '',
      lastName: fallbackLastNames[players.length] ?? `Seed-${players.length + 1}`,
      profileUrl: ''
    });
  }

  return players;
}

function detectBracketVariant(teamCount) {
  return teamCount >= 16 ? 'gbc-final' : 'tourstop';
}

function escapeSingleQuoted(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function toSveltePlayerLines(genderLabel, teams) {
  const svelteGender = genderLabel === 'men' ? 'Male' : 'Female';
  const lines = [];

  for (const team of teams) {
    for (const player of team.players) {
      lines.push(
        `new Player(Gender.${svelteGender}, '${escapeSingleQuoted(player.firstName)}', '${escapeSingleQuoted(player.lastName)}', 0),`
      );
    }
  }

  return lines;
}

function buildGeneratedPlayersFile(data) {
  const womenLines = toSveltePlayerLines('women', data.women.teams).map((line) => `\t\t${line}`);
  const menLines = toSveltePlayerLines('men', data.men.teams).map((line) => `\t\t${line}`);

  return [
    "import { Gender, Player } from '$lib/player';",
    '',
    `export const dvvWomenListUrl = '${escapeSingleQuoted(data.women.listUrl)}';`,
    `export const dvvMenListUrl = '${escapeSingleQuoted(data.men.listUrl)}';`,
    `export const dvvExtractedAt = '${escapeSingleQuoted(data.extractedAt)}';`,
    '',
    'export function createSeedPlayers(): Player[] {',
    '\treturn [',
    ...womenLines,
    ...menLines,
    '\t];',
    '}',
    ''
  ].join('\n');
}

async function writeGeneratedPlayersFile(outputPath, data) {
  const resolvedPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);

  await mkdir(path.dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, buildGeneratedPlayersFile(data), 'utf8');

  return resolvedPath;
}

async function extractTournament(listUrl, label) {
  const listHtml = await fetchText(listUrl.toString());
  const teams = extractSeedTeams(listHtml, listUrl.toString());
  const enrichedTeams = [];

  for (const team of teams) {
    const teamHtml = await fetchText(team.teamUrl);
    const players = extractTeamPlayers(teamHtml, team.teamUrl, team.teamLabel);

    enrichedTeams.push({
      seed: team.seed,
      teamLabel: team.teamLabel,
      teamUrl: team.teamUrl,
      players
    });
  }

  return {
    label,
    listUrl: listUrl.toString(),
    teamCount: enrichedTeams.length,
    bracketVariant: detectBracketVariant(enrichedTeams.length),
    teams: enrichedTeams
  };
}

async function resolveWomenAndMenUrls(inputUrl) {
  const normalizedInput = toSetzlisteUrl(new URL(inputUrl));
  const baseId = readTournamentId(normalizedInput);
  const inputHtml = await fetchText(normalizedInput.toString());
  const title = parseTitle(inputHtml).toLowerCase();

  let womenId = baseId;
  let menId = baseId + 1;

  if (title.includes('männer') || title.includes('maenner')) {
    menId = baseId;
    womenId = Math.max(1, baseId - 1);
  }

  return {
    sourceUrl: normalizedInput.toString(),
    womenUrl: withTournamentId(normalizedInput, womenId),
    menUrl: withTournamentId(normalizedInput, menId)
  };
}

function printSummary(data) {
  console.log(`Women list: ${data.women.listUrl}`);
  console.log(`Women teams: ${data.women.teamCount} -> ${data.women.bracketVariant}`);
  for (const team of data.women.teams) {
    const players = team.players
      .map((player) => `${player.firstName} ${player.lastName}`.trim())
      .join(' / ');
    console.log(`  ${team.seed}. ${players}`);
  }

  console.log('');
  console.log(`Men list: ${data.men.listUrl}`);
  console.log(`Men teams: ${data.men.teamCount} -> ${data.men.bracketVariant}`);
  for (const team of data.men.teams) {
    const players = team.players
      .map((player) => `${player.firstName} ${player.lastName}`.trim())
      .join(' / ');
    console.log(`  ${team.seed}. ${players}`);
  }

  console.log('');
  console.log('Svelte roster lines (women first, then men):');
  for (const line of toSveltePlayerLines('women', data.women.teams)) {
    console.log(line);
  }
  for (const line of toSveltePlayerLines('men', data.men.teams)) {
    console.log(line);
  }
}

async function main() {
  const { help, inputUrl, mode, writeToFile } = parseArgs(process.argv);

  if (help) {
    console.log(HELP_TEXT);
    return;
  }

  if (!inputUrl) {
    throw new Error('Missing URL argument. Use --help for usage.');
  }

  const { sourceUrl, womenUrl, menUrl } = await resolveWomenAndMenUrls(inputUrl);
  const women = await extractTournament(womenUrl, 'women');
  const men = await extractTournament(menUrl, 'men');

  const result = {
    sourceUrl,
    extractedAt: new Date().toISOString(),
    women,
    men
  };

  if (writeToFile) {
    const outputPath = await writeGeneratedPlayersFile(writeToFile, result);
    console.log(`Wrote generated players to ${outputPath}`);

    if (mode === 'summary') {
      console.log('');
    }
  }

  if (mode === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (mode === 'svelte') {
    for (const line of toSveltePlayerLines('women', women.teams)) {
      console.log(line);
    }
    for (const line of toSveltePlayerLines('men', men.teams)) {
      console.log(line);
    }
    return;
  }

  printSummary(result);
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
