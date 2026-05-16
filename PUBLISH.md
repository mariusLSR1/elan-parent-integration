# Publish to GitHub

The repo is initialized locally on branch `main` with an initial commit.

## One-time: log in to GitHub CLI

```bash
gh auth login
```

## Create the remote repository and push

From this folder:

```bash
gh repo create elan-parent-integration --public --source=. --remote=origin --push
```

If the repo already exists on GitHub:

```bash
git remote add origin git@github.com:mariusLSR1/elan-parent-integration.git
git push -u origin main
```

## After moving out of practicePlatform

1. Move this folder anywhere (e.g. `~/Code/elan-parent-integration`).
2. In each parent Next.js site:

   ```bash
   npm install github:mariusLSR1/elan-parent-integration
   ```

3. Optional: tag releases (`git tag v1.0.0 && git push --tags`) and pin installs to `#v1.0.0`.
