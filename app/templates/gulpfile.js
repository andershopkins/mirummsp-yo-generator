// generated on <%= date %> using <%= name %> <%= version %>
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');
// gulpLoad confusees these plugins with similarly named included packages, manually require them.
const notify = require('gulp-notify');
const cache = require('gulp-cached');
const wiredep = require('wiredep').stream;

<% if (includeAssemble) { -%>
const extname = require('gulp-extname');
const assemble = require('assemble');
const app = assemble();
const path = require('path');
var middleware = require('./app/helpers/middleware');
<% } -%>

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

<% if (includeAssemble) { -%>
// ** A library of helpers
app.helper('handlebars-helpers', require('handlebars-helpers')());
// ** Inline markdown helper
app.helper('markdown', require('helper-markdown'));
// ** External markdown helper
app.helper('md', 'app/helpers/helper-md-sync.js');

const contentPath = './app/content/';
app.onLoad(/./, middleware(app, contentPath));

gulp.task('load', function(cb) {
    app.data('app/data/*.json');
    app.partials('app/templates/partials/**/*.hbs');
    app.layouts('app/templates/layouts/**/*.hbs');
    app.pages('app/templates/pages/**/*.hbs');
    cb();
});

gulp.task('assemble', ['load'], function() {
    return app.toStream('pages')
    .pipe($.plumber({errorHandler: notify.onError("Error: <%%= error.message %>")}))
    .pipe(app.renderFile())
    .pipe(extname())
    .pipe(app.dest('.tmp'))
    .pipe(reload({stream: true}));
});
<% } -%>

gulp.task('styles', () => {<% if (includeSass) { %>
    return gulp.src('app/styles/*.scss')
        .pipe($.plumber({errorHandler: notify.onError("Error: <%%= error.message %>")}))
        .pipe($.sourcemaps.init())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))<% } else { %>
    return gulp.src('app/styles/*.css')
        .pipe($.sourcemaps.init())<% } %>
        .pipe($.autoprefixer({browsers: ['> 1%', 'last 4 versions']}))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('scripts', () => {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.plumber({errorHandler: notify.onError("Error: <%%= error.message %>")}))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(reload({stream: true}));
});
<% } -%>

function lint(files, options) {
    return gulp.src(files)
        .pipe(reload({stream: true, once: true}))
        .pipe($.eslint(options))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
    return lint('app/scripts/**/*.js', {
        fix: true
    })
        .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
    return lint('test/spec/**/*.js', {
        fix: true,
        env: {
<% if (testFramework === 'mocha') { -%>
            mocha: true
<% } else if (testFramework === 'jasmine') { -%>
            jasmine: true
<% } -%>
        }
    })
        .pipe(gulp.dest('test/spec/**/*.js'));
});

gulp.task('html', [<% if (includeBabel) { -%>'scripts', <% } -%><% if (includeAssemble) { -%>'assemble', <% } -%>'styles'], () => {
    return gulp.src(<% if (includeAssemble) { -%>'.tmp/**'<% } else { -%>'app/*.html'<%}-%>)
        .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
        //.pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
        .concat('app/fonts/**/*'))
        .pipe(gulp.dest('.tmp/fonts'))
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
    return gulp.src([
        'app/*.*',
        <% if (!includeAssemble) { -%>'!app/*.html'<% } -%>
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', [<% if (includeAssemble) { -%>'assemble',<% } -%> 'styles', <% if (includeBabel) { -%>'scripts',<% } -%> 'fonts'], () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['.tmp', 'app'],
            routes: {
                '/bower_components': 'bower_components'
            }
        }
    }, function (err, bs) {
        bs.addMiddleware("*", function (req, res) {
            res.writeHead(302, {
                "location": "/404.html"
            });
            res.end("Redirecting!");
        });
    });
<% if (includeAssemble) { -%>

    //watch for changes to assemble files, run assemble
    gulp.watch([
      'app/content/*.md',
      'app/data/*.json',
      'app/**/*.hbs'
    ], ['assemble']);
<% } -%>

    gulp.watch([
<% if (!includeAssemble) { -%>
        '.tmp/*.html',
<% } -%>
<% if (!includeBabel) { -%>
        'app/scripts/**/*.js',
<% } -%>
        'app/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
<% if (includeBabel) { -%>
    gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

<% if (includeBabel) { -%>
gulp.task('serve:test', ['scripts'], () => {
<% } else { -%>
gulp.task('serve:test', () => {
<% } -%>
    browserSync({
        notify: false,
        port: 9000,
        ui: false,
        server: {
            baseDir: 'test',
            routes: {
<% if (includeBabel) { -%>
                '/scripts': '.tmp/scripts',
<% } else { -%>
                '/scripts': 'app/scripts',
<% } -%>
                '/bower_components': 'bower_components'
            }
        }
    });

<% if (includeBabel) { -%>
    gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
    gulp.watch('test/spec/**/*.js').on('change', reload);
    gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {<% if (includeSass) { %>
    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)+/
        }))
        .pipe(gulp.dest('app/styles'));
<% } %>
    gulp.src('app/*.html')
        .pipe(wiredep({<% if (includeBootstrap) { if (includeSass) { %>
            exclude: ['bootstrap-sass'],<% } else { %>
            exclude: ['bootstrap.js'],<% }} %>
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
    cache.caches = {};
    return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
    gulp.start('build');
});

<% if (includeAssemble) { -%>
/* Expose your instance of assemble to the CLI  */
module.exports = app;
<% } %>
