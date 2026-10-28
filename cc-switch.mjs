#!/usr/bin/env node
// Switch Claude Code endpoint/token by editing the "env" block of ~/.claude/settings.json
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const dir = path.join(os.homedir(), '.claude');
const PROFILES = path.join(dir, 'profiles.json');
const SETTINGS = path.join(dir, 'settings.json');

const load = (f) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return {}; throw new Error(`${f}: ${e.message}`); }
};
const save = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');

function select(title, items) {
  return new Promise((res) => {
    let i = 0;
    const draw = (first) => {
      if (!first) process.stdout.write(`\x1b[${items.length}A`);
      items.forEach((t, n) => process.stdout.write(`\x1b[2K${n === i ? '\x1b[36m> ' : '  '}${t}\x1b[0m\n`));
    };
    console.log(title);
    draw(true);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on('keypress', function on(_, k) {
      if (k.ctrl && k.name === 'c') process.exit(130);
      if (k.name === 'up') i = (i - 1 + items.length) % items.length;
      else if (k.name === 'down') i = (i + 1) % items.length;
      else if (k.name === 'return') {
        process.stdin.setRawMode(false);
        process.stdin.off('keypress', on);
        process.stdin.pause();
        return res(i);
      }
      draw();
    });
  });
}

const ask = (q) => new Promise((res) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (a) => { rl.close(); res(a.trim()); });
});

const profiles = load(PROFILES); // { name: { url, token } }
const settings = load(SETTINGS);
const env = settings.env ?? {};
const names = Object.keys(profiles);
const active = names.find((n) => profiles[n].url === env.ANTHROPIC_BASE_URL && profiles[n].token === env.ANTHROPIC_AUTH_TOKEN);

const items = [
  ...names.map((n) => `${n}  (${profiles[n].url})${n === active ? '  [active]' : ''}`),
  '+ Add profile',
  '- Remove profile',
  `Default (Anthropic login, clear override)${!env.ANTHROPIC_BASE_URL ? '  [active]' : ''}`,
];
const pick = await select('Claude Code endpoint (up/down, enter):', items);

if (pick < names.length) {
  const p = profiles[names[pick]];
  env.ANTHROPIC_BASE_URL = p.url;
  env.ANTHROPIC_AUTH_TOKEN = p.token;
  settings.env = env;
  save(SETTINGS, settings);
  console.log(`Now using ${names[pick]}. Restart running claude sessions.`);
} else if (pick === names.length) {
  const name = await ask('Name: ');
  const url = await ask('Base URL: ');
  const token = await ask('Token/PAT: ');
  if (!name || !url || !token) { console.log('Aborted: all fields required.'); process.exit(1); }
  profiles[name] = { url, token };
  save(PROFILES, profiles);
  console.log(`Saved ${name}. Run again to select it.`);
} else if (pick === names.length + 1) {
  if (!names.length) process.exit(0);
  const r = await select('Remove which?', names);
  delete profiles[names[r]];
  save(PROFILES, profiles);
  console.log(`Removed ${names[r]}.`);
} else {
  delete env.ANTHROPIC_BASE_URL;
  delete env.ANTHROPIC_AUTH_TOKEN;
  settings.env = env;
  save(SETTINGS, settings);
  console.log('Back to default Anthropic login. Restart running claude sessions.');
}
