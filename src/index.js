#!/usr/bin/env node

const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const addr = require('email-addresses');

const spawn = (exe, args, cwd) => {
    return new Promise((resolve, reject) => {
        const buffer = [];
        exec.exec(exe, args, {
            cwd: cwd || process.cwd(),
            listeners: {
                stderr: (chunk) => {
                    buffer.push(chunk.toString());
                },
                stdout: (chunk) => {
                    buffer.push(chunk.toString());
                },
            }
        }).then(code => {
            const output = buffer.join('');
            if (code) {
                const msg = output || 'Process failed: ' + code;
                reject(new ProcessError(code, msg));
            } else {
                resolve(output);
            }
        })
    });
}

function main() {
    const defaults = {
        branch: 'gh-pages',
        remote: 'origin'
    };

    const options = {
        github_token: core.getInput('github_token') || process.env.GITHUB_TOKEN,
        dist: core.getInput('dist'),
        branch: core.getInput('branch') || defaults.branch,
        message: core.getInput('message'),
        repo: core.getInput('repo'),
        remote: core.getInput('remote') || defaults.remote,
        user: core.getInput('user'),
    }


    let user;
    if (options.user) {
        const parts = addr.parseOneAddress(options.user);
        if (!parts) {
            throw new Error(
                `Could not parse name and email from user option '${options.user}' ` +
                '(format should be "Your Name <email@example.com>")'
            );
        }
        user = { name: parts.name, email: parts.address };
    }



    const config = {
        github_token: options.github_token,
        dist: options.dist,
        repo: options.repo,
        branch: options.branch,
        message: options.message,
        remote: options.remote,
        user: user ? user : {
            name: `${github.context.repo.owner}`,
            email: `${github.context.repo.owner}@users.noreply.github.com`
        },
    };



    const newOptions = Object.assign({}, defaults, config);

    const repo = newOptions.repo ? newOptions.repo : `https://${github.context.repo.owner}:${newOptions.github_token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`


    spawn('git', ['config', '--global', 'user.name', newOptions.user.name])
    spawn('git', ['config', 'user.name']).then(output => {
        core.info(`---------- config username -----------`);
        core.info(`name: ${output}`);
    })

    spawn('git', ['config', '--global', 'user.email', newOptions.user.email])
    spawn('git', ['config', 'user.email']).then(output => {
        core.info(`---------- config email -----------`);
        core.info(`email: ${output}`);
    })

    spawn('git', ['remote', 'set-url', newOptions.remote, repo])
    spawn('git', ['config', '--get', 'remote.' + newOptions.remote + '.url']).then(output => {
        core.info(`---------- set url repo -----------`);
        const repo = output && output.split(/[\n\r]/).shift();
        core.info(`url-repo: ${repo}`);
    })
    spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD']).then(originBranch => {
        core.info(`---------- check base branch -----------`);
        core.info(`branch: ${originBranch}`);

        spawn('git', ['checkout', '-b', `${newOptions.branch}`]).then(output => {

            spawn('git', ['ls-remote', '--heads', `${newOptions.remote}`, `${newOptions.branch}`]).then(output => {
                if (output) {
                    core.info(`---------- update branch -----------`);
                    core.info(`${output}`);
                    spawn('git', ['pull', `${newOptions.remote}`, `${newOptions.branch}`])
                    spawn('git', ['rm', '-rf', `.`])
                    spawn('git', ['restore', '--staged', `${newOptions.dist}/*`, '.gitignore'])
                    spawn('git', ['checkout', '--', `${newOptions.dist}/*`, '.gitignore'])
                    spawn('cp', ['-r', `${newOptions.dist}/.`, './'])
                    spawn('git', ['rm', '-rf', `${newOptions.dist}`])
                    spawn('git', ['status', '--porcelain']).then((output) => {
                        if (!output) {
                            core.info(`Nothing to deploy`);
                        } else {
                            spawn('git', ['add', '.'])
                            spawn('git', ['commit', '-m', newOptions.message ? newOptions.message : `Deploying ${newOptions.branch} from ${originBranch}`])
                            spawn('git', ['push', `${newOptions.remote}`, `${newOptions.branch}`])
                            core.info(`---------- deploy successful -----------`);
                        }
                    })


                } else {
                    core.info(`---------- new branch -----------`);
                    core.info(`${output}`);
                    spawn('git', ['rm', '-rf', `.`])
                    spawn('git', ['restore', '--staged', `${newOptions.dist}/*`, '.gitignore'])
                    spawn('git', ['checkout', '--', `${newOptions.dist}/*`, '.gitignore'])
                    spawn('cp', ['-r', `${newOptions.dist}/.`, './'])
                    spawn('git', ['rm', '-rf', `${newOptions.dist}`])
                    spawn('git', ['status', '--porcelain']).then((output) => {
                        if (!output) {
                            core.info(`Nothing to deploy`);
                        } else {
                            spawn('git', ['add', '.'])
                            spawn('git', ['commit', '-m', newOptions.message ? newOptions.message : `Deploying ${newOptions.branch} from ${originBranch}`])
                            spawn('git', ['push', `${newOptions.remote}`, `${newOptions.branch}`])
                            core.info(`---------- deploy successful -----------`);
                        }
                    })
                }
            })


        })

    })
}

main()

