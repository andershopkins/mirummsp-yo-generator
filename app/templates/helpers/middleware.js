'use strict';

//a very simplistic middleware example
module.exports = function(app, path) {
    return function(file, next) {
        var content = file.data.content;
        var contentPath = path;
        var replace = content.replace(/\<\%(contentPath)\%\>/i, path);
        file.data.content = replace;
        next();
    };
};
