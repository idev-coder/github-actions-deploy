#!/usr/bin/env node

const ghpages = require('./publish');
const path = require('path');
const core = require('@actions/core');
const github = require('@actions/github');
const addr = require('email-addresses');

function publish(dist, config) {
    return new Promise((resolve, reject) => {
        const basePath = path.resolve(process.cwd(), dist);
        ghpages.publish(basePath, config, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

function main(args) {
    return Promise.resolve().then(() => {
        github.getOctokit(core.getInput('github_token') || process.env['GITHUB_TOKEN'])
        const options = {
            domain: core.getInput('domain') || 'github.com',
            github_token: core.getInput('github_token') || process.env['GITHUB_TOKEN'],
            dist: core.getInput('dist') || 'dist',
            dest: core.getInput('dest') || '.',
            add: typeof core.getInput('add') == "boolean" ? core.getInput('add') : !!core.getInput('add') || false,
            git: core.getInput('git') || 'git',
            depth: core.getInput('depth') || 1,
            dotfiles: typeof core.getInput('dotfiles') == "boolean" ? core.getInput('dotfiles') : !!core.getInput('dotfiles') || false,
            branch: core.getInput('branch') || 'gh-pages',
            remote: core.getInput('remote') || 'origin',
            src: core.getInput('src') || '**/*',
            remove: core.getInput('remove') || '.',
            push: typeof core.getInput('push') == "boolean" ? core.getInput('push') : !!core.getInput('push') || true,
            history: typeof core.getInput('history') == "boolean" ? core.getInput('history') : !!core.getInput('history') || true,
            message: core.getInput('message') || 'Updates',
            silent: typeof core.getInput('silent') == "boolean" ? core.getInput('silent') : !!core.getInput('silent') || false,
            repo: core.getInput('repo') || process.env['GITHUB_REPOSITORY'] || `${github.context.repo.owner}/${github.context.repo.repo}`,
            tag: core.getInput('tag'),
            user: {
                name: core.getInput('username') || `${github.context.repo.owner}`,
                email: core.getInput('email') || `${github.context.repo.owner}@users.noreply.github.com`
            }

        }


        const config = {
            github_token: options.github_token,
            domain: options.domain,
            repo: options.repo,
            silent: !!options.silent,
            branch: options.branch,
            src: options.src,
            dest: options.dest,
            message: options.message,
            tag: options.tag,
            git: options.git,
            depth: options.depth,
            dotfiles: !!options.dotfiles,
            add: !!options.add,
            remove: options.remove,
            remote: options.remote,
            push: !!options.push,
            history: !!options.history,
            user: options.user
        };

        return publish(options.dist, config);
    });
}

main(process.argv)
    .then(() => {
        process.stdout.write('Published\n');
    })
    .catch((err) => {
        process.stderr.write(`${err.stack}\n`, () => process.exit(1));
    });
