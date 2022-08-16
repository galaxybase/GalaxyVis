module.exports = {
    globals: {
        $: true,
        _: true,
    },
    rules: {
        'no-bitwise': 0, 
        'import/order': 0,
        'no-plusplus': 0,
        'no-console': ['error', {
            allow: ['warn', 'error']
        }],
        "no-debugger": 1,
        'operator-assignment': 0,
        'consistent-return': 0,
        'lines-between-class-members': 0,
        'class-methods-use-this': 0,
        'lines-between-class-members': 0,
        'no-multi-assign': 0,
        'no-continue': 0,
        'no-underscore-dangle': 0,
        'no-useless-constructor': 0,
        'prefer-destructuring': 0,
        'guard-for-in': 0,
        'no-restricted-globals': 0,
        'max-classes-per-file': 0,
    }
}