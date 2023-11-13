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
          src: '<src>' # Pattern used to select which files to publish set '**/*' by default.
          branch: '<branch>' # Name of the branch you are pushing to set 'gh-pages' by default.
          dest: '<dest>' # Target directory within the destination branch set (relative to the root) '.' by default.
          add: false # Only add, and never remove existing files
          silent: false # Do not output the repository url
          message: '<message>' # commit message set 'Updates' by default.
          tag: '<tag>' # add tag to commit
          git: '<git>' # Path to git executable set 'git' by default.
          dotfiles: false # Include dotfiles
          repo: 'https://git:${{GITHUB_TOKEN}}@github.com/user/private-repo.git' #URL of the repository you are pushing to
          depth: <depth> # depth for clone set 1 by default.
          remote: '<name>' # The name of the remote set 'origin' by default.
          user: 'username <username@users.noreply.github.com>' # The name and email of the user (defaults to the git config).  Format is "Your Name <email@example.com>".
          remove: '<pattern>' # emove files that match the given pattern (ignored if used together with --add). set '.' by default.
          no-push: true # Commit only (with no push)
          no-history: true # Push force new commit without parent history
          before-add: '<file>' # Execute the function exported by <file> before "git add"
        env:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```