module.exports = {
    datasource: {
        default: {
            type: 'sqlite',
            filename: ':memory:'
        }
    },
    presets: [
        '@objectos/preset-base'
    ]
};
