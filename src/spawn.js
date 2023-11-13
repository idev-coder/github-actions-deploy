const exec = require('@actions/exec');

exports.spawn = function spawn(exe, args, cwd) {
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