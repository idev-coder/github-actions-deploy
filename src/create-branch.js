
exports.createBranch = async function createBranch(getOctokit, context, options) {
    const toolkit = getOctokit(githubToken(options));
    // Sometimes branch might come in with refs/heads already
    const branch = options.branch.replace('refs/heads/', '');
    const ref = `refs/heads/${options.branch}`;

    // throws HttpError if branch already exists.
    try {
        await toolkit.rest.repos.getBranch({
            ...context.repo,
            branch,
        });
    } catch (error) {
        if (error.name === 'HttpError' && error.status === 404) {
            const resp = await toolkit.rest.git.createRef({
                ref,
                sha: context.sha,
                ...context.repo,
            });

            return resp?.data?.ref === ref;
        } else {
            throw Error(error);
        }
    }
}

function githubToken(options) {
    const token = options.github_token || process.env.GITHUB_TOKEN;
    if (!token) throw ReferenceError('No token defined in the environment variables');
    return token;
}