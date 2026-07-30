if (!process.env.AUTH_DEV && process.env.NODE_ENV !== 'production') process.env.AUTH_DEV = '1';
require.extensions['.txt'] = require.extensions['.js'];
require('./Qwen_js_20260725_tgmuaryvu.txt');
