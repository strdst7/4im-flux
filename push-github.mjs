/**
 * Create a GitHub repo and push this workspace to it.
 *
 *   GITHUB_TOKEN=ghp_xxx node push-github.mjs [repo-name] [public|private] [owner]
 *
 * Defaults: repo "aimirah", private, owned by the authenticated user. Pass an
 * owner (a user or an org you belong to) to create it there instead. The token
 * is read from the environment and passed to git as a per-command header, so it
 * never lands in .git/config.
 */
import { execSync } from "node:child_process";
import { writeFileSync, chmodSync, rmSync } from "node:fs";

const token = process.env.GITHUB_TOKEN;
const name = process.argv[2] || "aimirah";
const isPublic = (process.argv[3] || "private") === "public";
const owner = process.argv[4] || "";

if (!token) {
  console.error("GITHUB_TOKEN is not set.");
  console.error("GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)");
  console.error("Scope needed: repo  (or a fine-grained token with Contents: read/write)");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const run = cmd => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

async function api(path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(`${res.status} — ${body.message || res.statusText}`), { status: res.status, body });
  return body;
}

const me = await api("/user");
const target = owner || me.login;
console.log(`account:  ${me.login}${owner ? ` → creating in ${target}` : ""}`);

const payload = JSON.stringify({
  name,
  private: !isPublic,
  description: "4IM/Flux — a real-time GPU fluid playground. React/TS port of Pavel Dobryakov's WebGL-Fluid-Simulation (MIT).",
});

/* An org repo belongs to /orgs/{org}/repos; a personal one to /user/repos. */
const createPath = owner && owner.toLowerCase() !== me.login.toLowerCase()
  ? `/orgs/${owner}/repos`
  : "/user/repos";

let repo;
try {
  repo = await api(createPath, { method: "POST", body: payload });
  console.log(`created:  ${repo.full_name} (${isPublic ? "public" : "private"})`);
} catch (error) {
  if (error.status !== 422) throw error;
  repo = await api(`/repos/${target}/${name}`);
  console.log(`reusing:  ${repo.full_name} (already exists)`);
}

const url = `https://github.com/${repo.full_name}.git`;

try {
  run(`git remote remove origin`);
} catch {
  /* no remote yet */
}
run(`git remote add origin ${url}`);
run(`git branch -M main`);

/* Git over HTTPS wants basic auth, not a bearer header: hand it the token as
   the password via a throwaway askpass helper so nothing is cached. */
const askpass = "/tmp/.git-askpass";
writeFileSync(
  askpass,
  `#!/bin/sh\ncase "$1" in\n  *Username*) echo "x-access-token" ;;\n  *Password*) cat "$GITHUB_TOKEN_FILE" ;;\n  *) echo "" ;;\nesac\n`
);
chmodSync(askpass, 0o700);

try {
  const out = execSync(`git push -u origin main`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GIT_ASKPASS: askpass,
      GITHUB_TOKEN_FILE: "/tmp/ghtoken",
      GIT_TERMINAL_PROMPT: "0",
    },
  });
  console.log(out.trim().split("\n").filter(Boolean).slice(-1)[0]);
} finally {
  rmSync(askpass, { force: true });
}

console.log(`\nREPO URL: ${repo.html_url}`);
