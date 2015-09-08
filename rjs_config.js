({
    // Config options for use with the r.js optimiser
    name: 'main',
    out: './public/javascript/main.built.js',
    baseUrl: './public/javascript/',

    paths: {
        requireLib: 'lib/require',
        backbone: 'lib/backbone-min',
        underscore: 'lib/underscore-min',
        jquery: 'lib/jquery-2.1.4.min',
        mustache: 'lib/mustache.min'
    },
    include: ['requireLib']
})

