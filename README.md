# Github Actions Deploy

 See also the GitHub official GitHub Pages Action first.

## Example usage

``` yml
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
        uses: idev-coder/github-actions-deploy@v1.1.4
        with:
          github_token: ${{secrets.GITHUB_TOKEN}}
          dist: '<dist>' # Base directory for all source files
          branch: '<branch>' # Name of the branch you are pushing to set 'gh-pages' by default.
          message: '<message>' # commit message set 'Updates' by default.
          repo: 'https://git:${{GITHUB_TOKEN}}@github.com/user/private-repo.git' #URL of the repository you are pushing to
          remote: '<name>' # The name of the remote set 'origin' by default.
          user: 'username <username@users.noreply.github.com>' # The name and email of the user (defaults to the git config).  Format is "Your Name <email@example.com>".
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```