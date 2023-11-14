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

function gitDeploy(options) {
    spawn('git', ['ls-remote', '--heads', `${options.remote}`, `${options.branch}`]).then(output => {
        core.info(`ls-remote => ${output.trim()}`);
        if (output.trim().includes(options.branch)) {
            core.info(`---------- update branch -----------`);
            core.info(`branch:${options.branch}`);

            core.info(`info => ${output.trim()}`);
            spawn('git', ['rm', '-rf', `.`]).then(() => {
                spawn('git', ['restore', '--staged', `${options.dist}/*`, '.gitignore', '.github/*']).then(() => {
                    spawn('git', ['checkout', '--', `${options.dist}/*`, '.gitignore', '.github/*']).then(() => {
                        spawn('cp', ['-r', `${options.dist}/.`, './']).then(() => {
                            spawn('git', ['rm', '-rf', `${options.dist}`]).then(() => {
                                spawn('git', ['status', '--porcelain']).then((output) => {
                                    if (!output) {
                                        core.info(`Nothing to deploy`);
                                    } else {
                                        spawn('git', ['add', '.']).then(() => {
                                            spawn('git', ['commit', '-m', options.message ? options.message : `Deploying ${options.branch} from ${originBranch}`]).then(() => {
                                                core.info(`----------- Pull Successful -----------`);
                                                spawn('git', ['push', `${options.remote}`, `${options.branch}`]).then(() => {
                                                    core.info(`---------- deploy successful -----------`);
                                                })

                                            })
                                        })

                                    }
                                })
                            })

                        })

                    })

                })

            })




        } else {
            core.info(`---------- new branch -----------`);
            core.info(`branch:${options.branch}`);
            spawn('git', ['rm', '-rf', `.`]).then(() => {
                spawn('git', ['restore', '--staged', `${options.dist}/*`, '.gitignore', '.github/*']).then(() => {
                    spawn('git', ['checkout', '--', `${options.dist}/*`, '.gitignore', '.github/*']).then(() => {
                        spawn('cp', ['-r', `${options.dist}/.`, './']).then(() => {
                            spawn('git', ['rm', '-rf', `${options.dist}`]).then(() => {
                                spawn('git', ['status', '--porcelain']).then((output) => {
                                    if (!output) {
                                        core.info(`Nothing to deploy`);
                                    } else {
                                        spawn('git', ['add', '.']).then(() => {
                                            spawn('git', ['commit', '-m', options.message ? options.message : `Deploying ${options.branch} from ${originBranch}`]).then(() => {
                                                spawn('git', ['push', `${options.remote}`, `${options.branch}`]).then(() => {
                                                    core.info(`---------- deploy successful -----------`);
                                                })

                                            })

                                        })

                                    }
                                })
                            })

                        })

                    })

                })

            })

        }
    })

}


function git(options) {
    const repo = options.repo ? options.repo : `https://git:${options.github_token}@github.com/${github.context.repo.owner}/${github.context.repo.repo}.git`
    spawn('git', ['config', '--global', 'user.name', options.user.name]).then(() => {
        spawn('git', ['config', '--global', 'user.email', options.user.email]).then(() => {
            spawn('git', ['remote', 'set-url', options.remote, repo]).then(() => {

                spawn('git', ['config', 'user.name']).then(output => {
                    core.info(`---------- config username -----------`);
                    core.info(`name: ${output}`);
                })

                spawn('git', ['config', 'user.email']).then(output => {
                    core.info(`---------- config email -----------`);
                    core.info(`email: ${output}`);
                })

                spawn('git', ['config', '--get', 'remote.' + options.remote + '.url']).then(output => {
                    core.info(`---------- set url repo -----------`);
                    const repo = output && output.split(/[\n\r]/).shift();
                    core.info(`url-repo: ${repo}`);

                    spawn('git', ['rev-parse', '--abbrev-ref', 'HEAD']).then(originBranch => {
                        core.info(`---------- check base branch -----------`);
                        core.info(`branch: ${originBranch}`);

                        spawn('git', ['checkout', '-b', `${options.branch}`]).then(() => {
                            spawn('ls').then((list) => {
                                core.info(list)
                                if (list.trim().includes(options.dist)) {
                                    gitDeploy(options)
                                } else {
                                    spawn('npm', ['install']).then(() => {
                                        spawn('npm', ['run', 'build']).then(() => {
                                            gitDeploy(options)
                                        })
                                    })
                                }
                            })



                        })

                    })
                })



            })
        })
    })
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
    git(newOptions)






}

main()

