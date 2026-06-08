#!/usr/bin/env node
/**
 * Replit → GitHub sync via REST API
 * Pushes all local commits ahead of origin/main to GitHub
 */
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = 'edwardlarry067-oss';
const REPO = 'orbitfuture';
const BRANCH = 'main';

if (!TOKEN) {
  console.error('❌ GITHUB_PERSONAL_ACCESS_TOKEN not set');
  process.exit(1);
}

function git(cmd) {
  return execSync(`git --no-optional-locks ${cmd}`, { encoding: 'utf8' }).trim();
}

async function api(method, path, body) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'replit-sync',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const json = await res.json();
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// ── Get current state ─────────────────────────────────────────────────────────
const localHead = git('rev-parse HEAD');

// Get remote HEAD from GitHub API (don't rely on local remote tracking)
const remoteRef = await api('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const remoteHead = remoteRef.object.sha;

console.log(`Local  HEAD: ${localHead}`);
console.log(`Remote HEAD: ${remoteHead}`);

if (localHead === remoteHead) {
  console.log('✅ Already up to date — nothing to push.');
  process.exit(0);
}

// ── Find commits to push ──────────────────────────────────────────────────────
let commitsToPush;
try {
  const log = git(`log --reverse --format=%H ${remoteHead}..HEAD`);
  commitsToPush = log.split('\n').filter(Boolean);
} catch {
  // If remoteHead is not in local history (diverged), push HEAD as single commit
  commitsToPush = [localHead];
}

console.log(`\n📦 ${commitsToPush.length} commit(s) to push:`);
commitsToPush.forEach(sha => {
  const msg = git(`log --format=%s -1 ${sha}`);
  console.log(`  ${sha.slice(0, 8)}  ${msg}`);
});

// ── Push each commit ──────────────────────────────────────────────────────────
let currentRemoteSha = remoteHead;

for (const commitSha of commitsToPush) {
  const commitMsg = git(`log --format=%B -1 ${commitSha}`).trim();
  const authorName = git(`log --format=%an -1 ${commitSha}`);
  const authorEmail = git(`log --format=%ae -1 ${commitSha}`);
  const authorDate = git(`log --format=%aI -1 ${commitSha}`);

  // Get files changed in this commit
  const diffOutput = git(`diff-tree --no-commit-id -r --name-status ${commitSha}`);
  const lines = diffOutput.split('\n').filter(Boolean);

  if (lines.length === 0) {
    console.log(`\n⏭  Skipping empty commit ${commitSha.slice(0, 8)}`);
    currentRemoteSha = commitSha;
    continue;
  }

  console.log(`\n🔨 Processing commit ${commitSha.slice(0, 8)}: ${commitMsg.split('\n')[0]}`);

  // Get base tree from current remote commit
  const baseCommit = await api('GET', `/repos/${OWNER}/${REPO}/git/commits/${currentRemoteSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const treeItems = [];

  for (const line of lines) {
    const [status, ...fileParts] = line.split('\t');
    const filePath = fileParts[fileParts.length - 1];

    if (status === 'D') {
      // Deleted file — set sha to null
      treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: null });
      console.log(`  🗑  Deleted: ${filePath}`);
    } else {
      // Added or modified — check if file exists locally
      const absPath = `/home/runner/workspace/${filePath}`;
      if (!existsSync(absPath)) {
        console.log(`  ⚠️  Skipping missing file: ${filePath}`);
        continue;
      }

      const isBinary = /\.(jpg|jpeg|png|gif|webp|ico|svg|woff|woff2|ttf|eot|pdf|zip|gz)$/i.test(filePath);
      let content, encoding;

      if (isBinary) {
        content = readFileSync(absPath).toString('base64');
        encoding = 'base64';
      } else {
        content = readFileSync(absPath, 'utf8');
        encoding = 'utf-8';
      }

      const blob = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, { content, encoding });
      treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blob.sha });
      console.log(`  📄 ${status === 'A' ? 'Added' : 'Modified'}: ${filePath}`);
    }
  }

  // Create new tree
  const newTree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // Create commit
  const newCommit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: commitMsg,
    tree: newTree.sha,
    parents: [currentRemoteSha],
    author: { name: authorName, email: authorEmail, date: authorDate },
  });

  currentRemoteSha = newCommit.sha;
  console.log(`  ✅ Pushed as ${newCommit.sha.slice(0, 8)}`);
}

// ── Update branch reference ────────────────────────────────────────────────────
await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
  sha: currentRemoteSha,
  force: false,
});

console.log(`\n✅ Sync complete! GitHub main → ${currentRemoteSha.slice(0, 8)}`);
console.log(`🌐 GitHub Actions will now trigger a Vercel deployment.`);
console.log(`🔗 https://github.com/${OWNER}/${REPO}/actions`);
