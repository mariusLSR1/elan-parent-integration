# Publish to GitHub

The repo is initialized locally on branch `main` with an initial commit. Remote: `git@github.com:mariusLSR1/elan-parent-integration.git`.

## Windows: `gh` not found?

GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe`. Existing terminals opened **before** install do not see it on `PATH`.

**Option A — refresh PATH in the current PowerShell session:**

```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
gh --version
```

**Option B — call `gh` by full path (no PATH change):**

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" --version
```

Then close and reopen the terminal (or restart Cursor) so `gh` works everywhere.

## One-time: log in to GitHub CLI

```powershell
cd path\to\elan-parent-integration
gh auth login
# or: & "C:\Program Files\GitHub CLI\gh.exe" auth login
```

Choose: GitHub.com → HTTPS or SSH → authenticate in the browser.

## Create the remote repository and push (with gh)

```powershell
gh repo create elan-parent-integration --public --source=. --remote=origin --push
```

If `origin` already exists (this repo), create the empty repo then push:

```powershell
gh repo create mariusLSR1/elan-parent-integration --public
git push -u origin main
```

## Without gh (Git only)

1. Open https://github.com/new → name `elan-parent-integration` → Public → **do not** add README.
2. From this folder:

```powershell
git push -u origin main
```

## After moving out of practicePlatform

1. Move this folder anywhere (e.g. `~/Code/elan-parent-integration`).
2. In each parent Next.js site:

   ```bash
   npm install github:mariusLSR1/elan-parent-integration
   ```

3. Optional: tag releases (`git tag v1.0.0 && git push --tags`) and pin installs to `#v1.0.0`.
