const findCacheDir = require('find-cache-dir');
const Git = require('./git.js');
const filenamify = require('filenamify');
const copy = require('./util.js').copy;
const getUser = require('./util.js').getUser;
const fs = require('fs-extra');
const globby = require('globby');
const path = require('path');
const util = require('util');
const core = require('@actions/core');

const log = util.debuglog('gh-pages');

/**
 * Get the cache directory.
 * @param {string} [optPath] Optional path.
 * @return {string} The full path to the cache directory.
 */
function getCacheDir(optPath) {
    const dir = findCacheDir({ name: 'gh-pages' });
    if (!optPath) {
        return dir;
    }

    return path.join(dir, filenamify(optPath));
}
exports.getCacheDir = getCacheDir;

function getRepo(options) {
    const git = new Git(process.cwd(), options.git);
    git.setRemoteUrl(options);
    return git.getRemoteUrl(options.remote);
}

exports.defaults = {
    dist: core.getInput('dist') || 'dist',
    dest: core.getInput('dest') || '.',
    add: typeof core.getInput('add') == "boolean" ? core.getInput('add') : core.getInput('add') === "true" ? true : false || false,
    git: core.getInput('git') || 'git',
    depth: core.getInput('depth') || 1,
    dotfiles: typeof core.getInput('dotfiles') == "boolean" ? core.getInput('dotfiles') : core.getInput('dotfiles') === "true" ? true : false || false,
    branch: core.getInput('branch') || 'gh-pages',
    remote: core.getInput('remote') || 'origin',
    src: core.getInput('src') || '**/*',
    remove: core.getInput('remove') || '.',
    push: typeof core.getInput('push') == "boolean" ? core.getInput('push') : core.getInput('push') === "true" ? true : false || true,
    history: typeof core.getInput('history') == "boolean" ? core.getInput('history') : core.getInput('history') === "true" ? true : false || true,
    message: core.getInput('message') || 'Updates',
    silent: typeof core.getInput('silent') == "boolean" ? core.getInput('silent') : core.getInput('silent') === "true" ? true : false || false,
};

/**
 * Push a git branch to a remote (pushes gh-pages by default).
 * @param {string} basePath The base path.
 * @param {object} config Publish options.
 * @param {Function} callback Callback.
 * @return {Promise} A promise.
 */
exports.publish = function publish(basePath, config, callback) {
    if (typeof config === 'function') {
        callback = config;
        config = {};
    }

    const options = Object.assign({}, exports.defaults, config);

    // For backward compatibility before fixing #334
    if (options.only) {
        options.remove = options.only;
    }

    if (!callback) {
        callback = function (err) {
            if (err) {
                log(err.message);
            }
        };
    }

    function done(err) {
        try {
            callback(err);
        } catch (err2) {
            log('Publish callback threw: %s', err2.message);
        }
    }

    try {
        if (!fs.statSync(basePath).isDirectory()) {
            const err = new Error('The "base" option must be an existing directory');
            done(err);
            return Promise.reject(err);
        }
    } catch (err) {
        done(err);
        return Promise.reject(err);
    }

    const files = globby
        .sync(options.src, {
            cwd: basePath,
            dot: options.dotfiles,
        })
        .filter((file) => {
            return !fs.statSync(path.join(basePath, file)).isDirectory();
        });

    if (!Array.isArray(files) || files.length === 0) {
        done(
            new Error('The pattern in the "src" property didn\'t match any files.')
        );
        return;
    }

    let repoUrl;
    let userPromise;
    if (options.user) {
        userPromise = Promise.resolve(options.user);
    } else {
        userPromise = getUser();
    }
    return userPromise.then((user) =>
        getRepo(options)
            .then((repo) => {
                repoUrl = repo;
                const clone = getCacheDir(repo);
                log('Cloning %s into %s', repo, clone);
                return Git.clone(repo, clone, options.branch, options);
            })
            .then((git) => {
                return git.getRemoteUrl(options.remote).then((url) => {
                    if (url !== repoUrl) {
                        const message =
                            'Remote url mismatch.  Got "' +
                            url +
                            '" ' +
                            'but expected "' +
                            repoUrl +
                            '" in ' +
                            git.cwd +
                            '.  Try running the `gh-pages-clean` script first.';
                        throw new Error(message);
                    }
                    return git;
                });
            })
            .then((git) => {
                // only required if someone mucks with the checkout between builds
                log('Cleaning');
                return git.clean();
            })
            .then((git) => {
                log('Fetching %s', options.remote);
                return git.fetch(options.remote);
            })
            .then((git) => {
                log('Checking out %s/%s ', options.remote, options.branch);
                return git.checkout(options.remote, options.branch);
            })
            .then((git) => {
                if (!options.history) {
                    return git.deleteRef(options.branch);
                } else {
                    return git;
                }
            })
            .then((git) => {
                if (options.add) {
                    return git;
                }

                log('Removing files');
                const files = globby
                    .sync(options.remove, {
                        cwd: path.join(git.cwd, options.dest),
                    })
                    .map((file) => path.join(options.dest, file));
                if (files.length > 0) {
                    return git.rm(files);
                } else {
                    return git;
                }
            })
            .then((git) => {
                log('Copying files');
                return copy(files, basePath, path.join(git.cwd, options.dest)).then(
                    function () {
                        return git;
                    }
                );
            })
            .then((git) => {
                return Promise.resolve(
                    options.beforeAdd && options.beforeAdd(git)
                ).then(() => git);
            })
            .then((git) => {
                log('Adding all');
                return git.add('.');
            })
            .then((git) => {
                if (!user) {
                    return git;
                }
                return git.exec('config', 'user.email', user.email).then(() => {
                    if (!user.name) {
                        return git;
                    }
                    return git.exec('config', 'user.name', user.name);
                });
            })
            .then((git) => {
                log('Committing');
                return git.commit(options.message);
            })
            .then((git) => {
                if (options.tag) {
                    log('Tagging');
                    return git.tag(options.tag).catch((error) => {
                        // tagging failed probably because this tag alredy exists
                        log(error);
                        log('Tagging failed, continuing');
                        return git;
                    });
                } else {
                    return git;
                }
            })
            .then((git) => {
                if (options.push) {
                    log('Pushing');
                    return git.push(options.remote, options.branch, !options.history);
                } else {
                    return git;
                }
            })
            .then(
                () => done(),
                (error) => {
                    if (options.silent) {
                        error = new Error(
                            'Unspecified error (run without silent option for detail)'
                        );
                    }
                    done(error);
                }
            )
    );
};

/**
 * Clean the cache directory.
 */
exports.clean = function clean() {
    fs.removeSync(getCacheDir());
};
