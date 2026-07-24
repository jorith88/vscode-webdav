'use strict';

// upload()/compare() fire off their async chain without returning a promise the
// caller can await, so tests poll for an observable side effect (a spy being
// called) instead of awaiting the extension functions directly.
function waitFor(predicate, { timeout = 5000, interval = 20 } = {}) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        (function check() {
            let result;
            try {
                result = predicate();
            } catch (err) {
                reject(err);
                return;
            }
            if (result) {
                resolve(result);
                return;
            }
            if (Date.now() - start > timeout) {
                reject(new Error('waitFor: timed out waiting for condition'));
                return;
            }
            setTimeout(check, interval);
        })();
    });
}

module.exports = { waitFor };
