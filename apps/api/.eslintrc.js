module.exports = {
    extends: [require.resolve('@repo/config/eslint-preset')],
    root: true,
    env: {
        node: true,
        jest: true,
    },
};
