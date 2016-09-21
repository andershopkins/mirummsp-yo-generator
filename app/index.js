'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var mkdirp = require('mkdirp');
var _s = require('underscore.string');

module.exports = generators.Base.extend({
    constructor: function () {
        var testLocal;

        generators.Base.apply(this, arguments);

        this.option('skip-welcome-message', {
            desc: 'Skips the welcome message',
            type: Boolean
        });

        this.option('skip-install-message', {
            desc: 'Skips the message after the installation of dependencies',
            type: Boolean
        });

        this.option('babel', {
            desc: 'Use Babel',
            type: Boolean,
            defaults: true
        });

        this.option('test-framework', {
            desc: 'Test framework to be invoked',
            type: String,
            defaults: 'mocha'
        });

        if (this.options['test-framework'] === 'mocha') {
            testLocal = require.resolve('generator-mocha/generators/app/index.js');
        } else if (this.options['test-framework'] === 'jasmine') {
            testLocal = require.resolve('generator-jasmine/generators/app/index.js');
        }

        this.composeWith(this.options['test-framework'] + ':app', {
            options: {
                'skip-install': this.options['skip-install']
            }
        }, {
            local: testLocal
        });
    },

    initializing: function () {
        this.pkg = require('../package.json');
    },

    prompting: function () {
        var done = this.async();

        if (!this.options['skip-welcome-message']) {
            this.log(yosay('Mirum MSP Front End Generator.\nAssemble\nH5BP\nModernizr\njQuery\nSusy'));
        }

        var prompts = [{
            type: 'checkbox',
            name: 'features',
            message: 'What more would you like? (' + chalk.green.bold('Green means go!') + ')',
            choices: [{
                name: 'Modernizr',
                value: 'includeModernizr',
                checked: true
            }, {
                name: 'Bootstrap',
                value: 'includeBootstrap',
                checked: false
            }, {
                name: 'Assemble',
                value: 'includeAssemble',
                checked: false
            }]
        }, {
            type: 'confirm',
            name: 'includeJQuery',
            message: 'Would you like to include jQuery?',
            default: true,
            when: function (answers) {
                return answers.features.indexOf('includeBootstrap') === -1;
            }
        }];

        this.prompt(prompts, function (answers) {
            var features = answers.features;

            function hasFeature(feat) {
                return features && features.indexOf(feat) !== -1;
            };

            // manually deal with the response, get back and store the results.
            // we change a bit this way of doing to automatically do this in the self.prompt() method.
            this.includeSass = true;
            this.includeBootstrap = hasFeature('includeBootstrap');
            this.includeModernizr = hasFeature('includeModernizr');
            this.includeAssemble = hasFeature('includeAssemble');
            this.includeJQuery = answers.includeJQuery;

            done();
        }.bind(this));
    },

    writing: {
        gulpfile: function () {
            this.fs.copyTpl(
                this.templatePath('gulpfile.js'),
                this.destinationPath('gulpfile.js'),
                {
                    date: (new Date).toISOString().split('T')[0],
                    name: this.pkg.name,
                    version: this.pkg.version,
                    includeSass: this.includeSass,
                    includeBootstrap: this.includeBootstrap,
                    includeAssemble: this.includeAssemble,
                    includeBabel: this.options['babel'],
                    testFramework: this.options['test-framework']
                }
            );
        },

        packageJSON: function () {
            this.fs.copyTpl(
                this.templatePath('_package.json'),
                this.destinationPath('package.json'),
                {
                    includeSass: this.includeSass,
                    includeAssemble: this.includeAssemble,
                    includeBabel: this.options['babel']
                }
            );
        },

        babel: function () {
            this.fs.copy(
                this.templatePath('babelrc'),
                this.destinationPath('.babelrc')
            );
        },

        git: function () {
            this.fs.copy(
                this.templatePath('gitignore'),
                this.destinationPath('.gitignore'));

            this.fs.copy(
                this.templatePath('gitattributes'),
                this.destinationPath('.gitattributes'));
        },

        bower: function () {
            var bowerJson = {
                name: _s.slugify(this.appname),
                private: true,
                dependencies: {
                    'breakpoint-sass': '^2.7.0'
                }
            };

            if (this.includeBootstrap) {
                if (this.includeSass) {
                    bowerJson.dependencies['bootstrap-sass'] = '^3.3.5';
                    bowerJson.overrides = {
                        'bootstrap-sass': {
                            'main': [
                                'assets/stylesheets/_bootstrap.scss',
                                'assets/fonts/bootstrap/*',
                                'assets/javascripts/bootstrap.js'
                            ]
                        }
                    };
                }
                // remove LESS version of Bootstap
                //  else {
                //   bowerJson.dependencies['bootstrap'] = '~3.3.5';
                //   bowerJson.overrides = {
                //     'bootstrap': {
                //       'main': [
                //         'less/bootstrap.less',
                //         'dist/css/bootstrap.css',
                //         'dist/js/bootstrap.js',
                //         'dist/fonts/*'
                //       ]
                //     }
                //   };
                // }
            } else if (this.includeJQuery) {
                bowerJson.dependencies['jquery'] = '^2.1.1';
            }

            if (this.includeModernizr) {
                bowerJson.dependencies['modernizr'] = '~2.8.1';
            }

            if (!this.includeBootstrap) {
                bowerJson.dependencies['susy'] = '^2.2.7';
            }

            this.fs.writeJSON('bower.json', bowerJson);
            this.fs.copy(
                this.templatePath('bowerrc'),
                this.destinationPath('.bowerrc')
            );
        },

        editorConfig: function () {
            this.fs.copy(
                this.templatePath('editorconfig'),
                this.destinationPath('.editorconfig')
            );
        },

        h5bp: function () {
            this.fs.copy(
                this.templatePath('favicon.ico'),
                this.destinationPath('app/favicon.ico')
            );

            this.fs.copy(
                this.templatePath('apple-touch-icon.png'),
                this.destinationPath('app/apple-touch-icon.png')
            );

            this.fs.copy(
                this.templatePath('robots.txt'),
                this.destinationPath('app/robots.txt'));
        },

        styles: function () {
                this.fs.copy(
                    this.templatePath('styles/**/*'),
                    this.destinationPath('app/styles/')
                );

                mkdirp('app/styles/vendor');

            var css = 'main';

            if (this.includeSass) {
                css += '.scss';
            } else {
                css += '.css';
            }

            this.fs.copyTpl(
                this.templatePath(css),
                this.destinationPath('app/styles/' + css),
                {
                    includeBootstrap: this.includeBootstrap,
                    includeAssemble: this.includeAssemble
                }
            );
        },

        scripts: function () {
            this.fs.copy(
                this.templatePath('main.js'),
                this.destinationPath('app/scripts/main.js')
            );
        },

        assemble: function () {
          if (this.includeAssemble) {

            // copy local helpers files
            this.fs.copy(
                this.templatePath('helpers/**/*'),
                this.destinationPath('app/helpers/')
            );
            // *** Why not layouts? Because we're processing with Yeoman and Anders is dumb and wants this to be done now.
            // copy pages
            this.fs.copy(
                this.templatePath('templates/partials/**/*'),
                this.destinationPath('app/templates/partials/')
            );

            // copy partials
            this.fs.copy(
                this.templatePath('templates/pages/**/*'),
                this.destinationPath('app/templates/pages/')
            );

            // copy content files
            this.fs.copy(
                this.templatePath('content/**/*'),
                this.destinationPath('app/content/')
            );

            // copy data files
            this.fs.copy(
                this.templatePath('data/**/*'),
                this.destinationPath('app/data/')
            );
          }
        },

        html: function () {
            if (!this.includeAssemble) {
                var bsPath;

                // path prefix for Bootstrap JS files
                if (this.includeBootstrap) {
                    bsPath = '/bower_components/';

                    if (this.includeSass) {
                        bsPath += 'bootstrap-sass/assets/javascripts/bootstrap/';
                    } else {
                        bsPath += 'bootstrap/js/';
                    }
                }

                this.fs.copyTpl(
                    this.templatePath('index.html'),
                    this.destinationPath('app/index.html'),
                    {
                        appname: this.appname,
                        includeSass: this.includeSass,
                        includeBootstrap: this.includeBootstrap,
                        includeModernizr: this.includeModernizr,
                        includeJQuery: this.includeJQuery,
                        bsPath: bsPath,
                        bsPlugins: [
                            'affix',
                            'alert',
                            'dropdown',
                            'tooltip',
                            'modal',
                            'transition',
                            'button',
                            'popover',
                            'carousel',
                            'scrollspy',
                            'collapse',
                            'tab'
                        ]
                    }
                );
            }
        },

        hbs: function() {
            if (this.includeAssemble) {
                var bsPath;
                var jqPath;

                // path prefix for Bootstrap JS files
                if (this.includeBootstrap) {
                    bsPath = '/bower_components/';

                    if (this.includeSass) {
                        bsPath += 'bootstrap-sass/assets/javascripts/bootstrap/';
                    } else {
                        bsPath += 'bootstrap/js/';
                    }
                }
                this.fs.copyTpl(
                    this.templatePath('templates/layouts/default.hbs'),
                    this.destinationPath('app/templates/layouts/default.hbs'),
                    {
                        appname: this.appname,
                        includeSass: this.includeSass,
                        includeBootstrap: this.includeBootstrap,
                        includeModernizr: this.includeModernizr,
                        includeJQuery: this.includeJQuery,
                        bsPath: bsPath,
                        bsPlugins: [
                            'affix',
                            'alert',
                            'dropdown',
                            'tooltip',
                            'modal',
                            'transition',
                            'button',
                            'popover',
                            'carousel',
                            'scrollspy',
                            'collapse',
                            'tab'
                        ]
                    }
                );
            }
        },

        misc: function () {
          mkdirp('app/images');
          mkdirp('app/fonts');

          if (!this.includeAssemble) {
              mkdirp('app/partials/layout');
              mkdirp('app/partials/modules');
              mkdirp('app/partials/pages');
          }
        }
    },

    install: function () {
        this.installDependencies({
            skipMessage: this.options['skip-install-message'],
            skipInstall: this.options['skip-install']
        });
    },

    end: function () {
        var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
        var howToInstall =
            '\nAfter running ' +
            chalk.yellow.bold('npm install & bower install') +
            ', inject your' +
            '\nfront end dependencies by running ' +
            chalk.yellow.bold('gulp wiredep') +
            '.';

        if (this.options['skip-install']) {
            this.log(howToInstall);
            return;
        }

        // wire Bower packages to .html
        wiredep({
            bowerJson: bowerJson,
            directory: 'bower_components',
            exclude: ['bootstrap-sass', 'bootstrap.js'],
            ignorePath: /^(\.\.\/)*\.\./,
            src: 'app/index.html'
        });

        if (this.includeSass) {
            // wire Bower packages to .scss
            wiredep({
                bowerJson: bowerJson,
                directory: 'bower_components',
                ignorePath: /^(\.\.\/)+/,
                src: 'app/styles/*.scss'
            });
        }
    }
});
