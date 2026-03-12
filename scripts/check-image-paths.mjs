#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const scanRoots = ['src', 'public', 'README.md', 'docs'];
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', '.astro']);
const ignoredFileRe = /\.(test|spec)\.[cm]?[jt]sx?$/;
const textExtensions = new Set([
  '.md',
  '.mdx',
  '.astro',
  '.html',
  '.css',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.json'
]);

const imageExtRe = /\.(png|jpe?g|webp|gif|avif|svg)(?:[?#].*)?$/i;
const adultKeywordRe =
  /(r18|18\+|nsfw|adult|ero|hentai|porn|explicit|nude|nudity|sex|fetish|ecchi|中出し|寝取|レイプ|輪姦|凌辱|性行為|露出|陰茎|膣|乳首)/i;
const signedUrlHints = [
  '/private/',
  'px-time=',
  'px-hash=',
  'token=',
  'signature=',
  'expires=',
  'exp=',
  'x-amz-signature=',
  'x-goog-signature='
];
const externalAllowlist = new Set(['img.dlsite.jp']);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function stripQueryAndHash(value) {
  return value.split(/[?#]/, 1)[0];
}

function normalizeRawTarget(value) {
  const trimmed = stripQuotes(value.trim());
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function lineMatches(line) {
  const out = [];
  const seen = new Set();
  const push = (match, sourceType) => {
    const target = normalizeRawTarget(match);
    if (!target) return;
    const key = `${sourceType}:${target}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ target, sourceType });
  };

  const mdImageRe = /!\[[^\]]*]\(([^)\n]+)\)/g;
  for (const m of line.matchAll(mdImageRe)) {
    const raw = m[1].trim();
    const target = raw.startsWith('<') ? raw : raw.split(/\s+/)[0];
    push(target, 'markdown');
  }

  const imgSrcRe = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  for (const m of line.matchAll(imgSrcRe)) {
    push(m[1] ?? m[2] ?? m[3] ?? '', 'img-src');
  }

  const sourceSrcsetRe = /<source\b[^>]*\bsrcset\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  for (const m of line.matchAll(sourceSrcsetRe)) {
    const srcset = m[1] ?? m[2] ?? m[3] ?? '';
    const first = srcset.split(',')[0]?.trim().split(/\s+/)[0] ?? '';
    push(first, 'srcset');
  }

  const withBaseRe = /withBase\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const m of line.matchAll(withBaseRe)) {
    push(m[1], 'withBase');
  }

  const quotedImagePathRe = /["']([^"']+\.(?:png|jpe?g|webp|gif|avif|svg)(?:\?[^"']*)?)["']/gi;
  for (const m of line.matchAll(quotedImagePathRe)) {
    push(m[1], 'quoted-path');
  }

  const rawUrlRe = /(https?:\/\/[^\s"'()<>]+|\/\/[^\s"'()<>]+)/gi;
  for (const m of line.matchAll(rawUrlRe)) {
    push(m[1], 'raw-url');
  }

  return out.filter(({ target }) => imageExtRe.test(target));
}

function isRemote(target) {
  return /^https?:\/\//i.test(target) || /^\/\//.test(target);
}

function normalizeToUrl(target) {
  if (/^\/\//.test(target)) return `https:${target}`;
  return target;
}

function resolveLocalImagePath(filePath, target) {
  const clean = stripQueryAndHash(target);
  if (clean.startsWith('/')) {
    return path.join(repoRoot, 'public', clean.slice(1));
  }
  if (clean.startsWith('images/')) {
    return path.join(repoRoot, 'public', clean);
  }
  if (clean.startsWith('./') || clean.startsWith('../')) {
    return path.resolve(path.dirname(filePath), clean);
  }
  return path.resolve(path.dirname(filePath), clean);
}

function relativeFromRepo(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function severityRank(level) {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

function hostFromTarget(target) {
  try {
    const url = new URL(normalizeToUrl(target));
    return url.hostname.toLowerCase();
  } catch {
    return '';
  }
}

async function analyzeTarget(filePath, lineNumber, sourceType, target) {
  const lower = target.toLowerCase();
  const reasons = [];
  let severity = null;

  if (adultKeywordRe.test(lower)) {
    severity = 'high';
    reasons.push('path includes adult keyword');
  }

  if (isRemote(target)) {
    const host = hostFromTarget(target);
    const signed = signedUrlHints.some((hint) => lower.includes(hint));
    if (signed) {
      severity = severityRank('medium') > severityRank(severity ?? 'low') ? 'medium' : severity;
      reasons.push('remote URL looks private/signed (may expire)');
    }
    if (host && !externalAllowlist.has(host)) {
      if (!severity) severity = 'low';
      reasons.push(`external image host: ${host}`);
    }
  } else {
    const resolved = resolveLocalImagePath(filePath, target);
    if (!(await exists(resolved))) {
      severity = severityRank('medium') > severityRank(severity ?? 'low') ? 'medium' : severity;
      reasons.push(`local image not found: ${relativeFromRepo(resolved)}`);
    }
  }

  if (!severity) return null;
  return {
    severity,
    file: relativeFromRepo(filePath),
    line: lineNumber,
    sourceType,
    target,
    reasons
  };
}

async function* walkFiles(entryPath) {
  let stat;
  try {
    stat = await fs.stat(entryPath);
  } catch {
    return;
  }

  if (stat.isFile()) {
    yield entryPath;
    return;
  }
  if (!stat.isDirectory()) return;

  const entries = await fs.readdir(entryPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) {
      continue;
    }
    const next = path.join(entryPath, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(next);
      continue;
    }
    if (entry.isFile()) {
      if (ignoredFileRe.test(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (textExtensions.has(ext)) {
        yield next;
      }
    }
  }
}

async function main() {
  const findings = [];

  for (const root of scanRoots) {
    const absolute = path.join(repoRoot, root);
    for await (const filePath of walkFiles(absolute)) {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const ext = path.extname(filePath).toLowerCase();
      const markdownFile = ext === '.md' || ext === '.mdx';
      let inCodeFence = false;
      for (let i = 0; i < lines.length; i += 1) {
        if (markdownFile && /^\s*(```|~~~)/.test(lines[i])) {
          inCodeFence = !inCodeFence;
          continue;
        }
        if (markdownFile && inCodeFence) {
          continue;
        }
        const matches = lineMatches(lines[i]);
        for (const match of matches) {
          const finding = await analyzeTarget(filePath, i + 1, match.sourceType, match.target);
          if (finding) findings.push(finding);
        }
      }
    }
  }

  findings.sort((a, b) => {
    const sev = severityRank(b.severity) - severityRank(a.severity);
    if (sev !== 0) return sev;
    const fileCompare = a.file.localeCompare(b.file);
    if (fileCompare !== 0) return fileCompare;
    return a.line - b.line;
  });

  if (findings.length === 0) {
    console.log('check-image-paths: no risky image paths found.');
    process.exit(0);
  }

  console.log('check-image-paths: findings');
  for (const finding of findings) {
    console.log(
      `[${finding.severity.toUpperCase()}] ${finding.file}:${finding.line} (${finding.sourceType})`
    );
    console.log(`  target: ${finding.target}`);
    for (const reason of finding.reasons) {
      console.log(`  - ${reason}`);
    }
  }

  const hasBlocking = findings.some(
    (finding) => finding.severity === 'high' || finding.severity === 'medium'
  );
  if (hasBlocking) {
    console.error(
      'check-image-paths: blocking findings detected (high/medium). replace these paths before release.'
    );
    process.exit(1);
  }

  console.log('check-image-paths: only low-risk findings (non-blocking).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
