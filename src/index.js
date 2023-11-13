#!/usr/bin/env node
const path = require('path');
const core = require('@actions/core');
const ghpages = require('./gh-pages');
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
        const options = {
            dist: core.getInput('dist'),
            src: core.getInput('src') || ghpages.defaults.src,
            branch: core.getInput('branch') || ghpages.defaults.branch,
            dest: core.getInput('dest') || ghpages.defaults.dest,
            add: core.getInput('add'),
            silent: core.getInput('silent'),
            message: core.getInput('message') || ghpages.defaults.message,
            tag: core.getInput('tag'),
            git: core.getInput('git') || ghpages.defaults.git,
            dotfiles: core.getInput('dotfiles'),
            repo: core.getInput('repo'),
            depth: core.getInput('depth') || ghpages.defaults.depth,
            remote: core.getInput('remote') || ghpages.defaults.remote,
            user: core.getInput('user'),
            remove: core.getInput('remove') || ghpages.defaults.remove,
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
            user: user,
            beforeAdd: beforeAdd,
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
