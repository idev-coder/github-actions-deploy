# Github Actions Deploy

 See also the GitHub official GitHub Pages Action first.

## Inputs

### `domain`

Set GitHub Domain `github.com` by default.

### `github_token`

Set GitHub token `${{secrets.GITHUB_TOKEN}}`

### `dist`

Set GitHub dist `dist` by default.

### `dest`

Set GitHub dest `.` by default.

### `add`

Set GitHub add `true` by default.

### `git`

Set GitHub git `git` by default.

### `depth`

Set GitHub depth `1` by default.

### `dotfiles`

Set GitHub dotfiles `true` by default.

### `branch`

Set GitHub branch `gh-pages` by default.

### `remote`

Set GitHub remote `origin` by default.

### `src`

Set GitHub src `**/*` by default.

### `remove`

Set GitHub remove `.` by default.

### `push`

Set GitHub push `true` by default.

### `message`

Set GitHub message `Updates` by default.

### `silent`

Set GitHub silent `true` by default.

### `repo`

Set Example GitHub repo `[onwner]/[repo]`

### `tag`
Set Example GitHub tag `[tag]`

### `username`
Set Example GitHub username `[username]`

### `email`
Set Example GitHub email `[email]`

## Example usage

```
name: GitHub Pages

on:
  push:
    branches:
      - main  # Set a branch name to trigger deployment
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v3
      - name: Github Actions Deploy
        uses: idev-coder/github-actions-deploy@v1.0.7
        with:
          dist: 'dist'
          branch: 'gh-pages'
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}

```