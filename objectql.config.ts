export default {
    datasource: {
        default: {
            type: 'sqlite',
            filename: ':memory:'
        }
    },
    presets: [
        '@objectos/preset-base',
        '@example/project-management'
    ]
};
