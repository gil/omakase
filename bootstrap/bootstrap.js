"use strict";

var glob = require("glob"),
    path = require("path"),
    _ = require("lodash"),
    prompt = require("prompt"),
    changeCase = require("change-case"),
    fs = require("fs");

function replaceFiles(name) {

  var camelCase = changeCase.camelCase(name),
      paramCase = changeCase.paramCase(name),
      snakeCase = changeCase.snakeCase(name),
      titleCase = changeCase.titleCase(name),
      constantCase = changeCase.constantCase(name),
      pascalCase = changeCase.pascalCase(name);

  console.log( "Generating file list..." );
  glob("**/+(Vagrantfile|*.+(coffee|rb|html|erb|yml|json|conf|sh))", { cwd : path.resolve(__dirname, "..") }, function (er, files) {
    files = _.filter(files, function(file){ return !file.match(/\/(node_modules|bower_components|coverage)\//); });

    _.each(files, function(file){
      console.log( "Reading file : " + file + "..." );
      fs.readFile(file, "utf8", function (err,data) {
        if (err) { return console.log(err); }

        console.log( "Replacing in file " + file + "..." );

        var result = data.replace(/myApp/g, camelCase) // myApp
                         .replace(/my\-app/g, paramCase) // my-app
                         .replace(/my_app/g, snakeCase) // my_app
                         .replace(/My\sApp/g, titleCase) // My App
                         .replace(/MY_APP/g, constantCase) // MY_APP
                         .replace(/MyApp/g, pascalCase); // MyApp

        fs.writeFile(file, result, "utf8", function (err) {
          if (err) { return console.log(err); }
        });
      });
    });

  });
}

prompt.start();

console.log( "Enter the project name:" );
prompt.get({ properties: { name: { pattern: /^[a-zA-Z\d]+$/, message: "Name must be only letters or numbers!", required: true } } }, function (err, result) {
  if (err) { return console.log(err); }
  replaceFiles(result.name);
});