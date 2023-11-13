#!/usr/bin/env node
const path = require('path');
const core = require('@actions/core');
const addr = require('email-addresses');
const github = require('@actions/github');
const { getOctokit, context } = require('@actions/github');
const { publish, defaults } = require('./publish');
const { spawn } = require('./spawn')
const { createBranch } = require('./create-branch')

function deploy(dist, config) {
    return new Promise((resolve, reject) => {
        const basePath = path.resolve(process.cwd(), dist);
        publish(basePath, config, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

function main() {
    return Promise.resolve().then(() => {
        const options = {
            github_token: core.getInput('github_token') || process.env.GITHUB_TOKEN,
            dist: core.getInput('dist'),
            src: core.getInput('src') || defaults.src,
            branch: core.getInput('branch') || defaults.branch,
            dest: core.getInput('dest') || defaults.dest,
            add: core.getInput('add'),
            silent: core.getInput('silent'),
            message: core.getInput('message') || defaults.message,
            tag: core.getInput('tag'),
            git: core.getInput('git') || defaults.git,
            dotfiles: core.getInput('dotfiles'),
            repo: core.getInput('repo'),
            depth: core.getInput('depth') || defaults.depth,
            remote: core.getInput('remote') || defaults.remote,
            user: core.getInput('user'),
            remove: core.getInput('remove') || defaults.remove,
            push: core.getInput('no-push'),
            history: core.getInput('no-history'),
            beforeAdd: core.getInput('before-add')

        }


        let user;
        if (options.user) {
            const parts = addr.parseOneAddress(options.user);
            if (!parts) {
                throw new Error(
                    `Could not parse name and email from user option "${options.user}" ` +
                    '(format should be "Your Name <email@example.com>")'
                );
            }
            user = { name: parts.name, email: parts.address };
        }
        let beforeAdd;
        if (options.beforeAdd) {
            const m = require(require.resolve(options.beforeAdd, {
                paths: [process.cwd()],
            }));

            if (typeof m === 'function') {
                beforeAdd = m;
            } else if (typeof m === 'object' && typeof m.default === 'function') {
                beforeAdd = m.default;
            } else {
                throw new Error(
                    `Could not find function to execute before adding files in ` +
                    `"${options.beforeAdd}".\n `
                );
            }
        }


        const config = {
            github_token: options.github_token,
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
            user: {
                name: user.name ? user.name : `${github.context.actor}`,
                email: user.email ? user.email : `${github.context.actor}@users.noreply.github.com`
            },
            beforeAdd: beforeAdd,
        };

        const newOptions = Object.assign({}, defaults, config);

        const repo = newOptions.repo ? newOptions.repo : `https://${github.context.actor}:${newOptions.github_token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`


        spawn("git", ["config", "--global", "user.email", newOptions.user.email])
        spawn("git", ["config", "--global", "user.name", newOptions.user.name])
        spawn("git", ["remote", "set-url", newOptions.remote, repo])

        core.debug(`Creating branch ${newOptions.branch}`);
        createBranch(getOctokit, context, newOptions).then((isCreated) => {
            core.setOutput('created', isCreated);
        }).catch((error) => {
            core.setFailed(error.message);
        })

        return deploy(options.dist, config);

    });
}

main()
    .then(() => {
        process.stdout.write('Published\n');
    })
    .catch((err) => {
        process.stderr.write(`${err.stack}\n`, () => process.exit(1));
    });
