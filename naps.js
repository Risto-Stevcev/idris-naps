#!/usr/bin/env node

var R = require('ramda')
  , fs = require('fs')
  , path = require('path')
  , exec = require('child_process').exec
  , execSync = require('child_process').execSync
  , globby = require('globby')

var localLibsPath = path.resolve(process.cwd(), 'libs')
  , localLibs = globby.sync(path.resolve(localLibsPath, '*'))
  , idrisLibsPath = process.env.IDRIS_LIBRARY_PATH || '/usr/share/idris/libs'
  , idrisBinPath = process.env.IDRIS_BINARY_PATH || 'idris'
  , idrisLibs = globby.sync(path.resolve(idrisLibsPath, '*'))

var env = R.merge(process.env, { IDRIS_LIBRARY_PATH: localLibsPath })
  , bowerJson = require(path.resolve(process.cwd(), 'bower.json'))


if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.lastIndexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}


var checkLocalLibsExists = function() {
  try {
    var libsStats = fs.statSync(localLibsPath)
  }
  catch (e) {
    fs.mkdirSync(localLibsPath)
  }

  if (libsStats && !libsStats.isDirectory())
    throw new Error(path.resolve(localLibsPath + ' is not a directory'))
}

// Sorts the libraries by their dependencies, so that necessary deps are already installed for each element
var sortLibs = function(libsDeps) {
  var sortedLibs = []
  while (Object.keys(libsDeps).length > 0) {
    for (var libName in libsDeps) {
      var deps = libsDeps[libName]
      if (!deps) {
        sortedLibs.push(libName)
        delete libsDeps[libName]
      }
      else if (Object.keys(deps).every(dep => R.contains(dep, sortedLibs))) {
        sortedLibs.push(libName)
        delete libsDeps[libName]
      }
    }
  }
  return sortedLibs
}

var installDeps = function() {
  checkLocalLibsExists()

  exec('bower install', function(err) {
    if (err) throw err

    var paths = globby.sync(path.resolve(process.cwd(), 'bower_components/*'))
    var libs = paths.map(p => path.basename(p))
    var libsDeps = libs.reduce((acc, lib) => {
      acc[lib] = require(path.resolve(process.cwd(), 'bower_components', lib, '.bower.json')).dependencies
      return acc
    }, {})

    sortLibs(libsDeps).forEach(lib => {
      var libPath = path.resolve(process.cwd(), 'bower_components', lib)
        , includes = R.intersperse('-i', localLibs.concat(idrisLibs).concat(libPath)).join(' ')
        , ipkgPath = path.resolve(process.cwd(), 'bower_components', lib, `${lib}.ipkg`)

      execSync(`${idrisBinPath} -i ${includes} --install ${ipkgPath}`, { cwd: libPath, stdio: [0,1,2], env: env })
    })
  })
}

var args = process.argv[0].endsWith('node') || process.argv[0].endsWith('nodejs')
         ? process.argv.slice(2) : process.argv.slice(1)

if (args[0] === '--install-deps')
  installDeps()
else {
  var includes = R.intersperse('-i', localLibs.concat(idrisLibs)).join(' ')
  execSync(`${idrisBinPath} -i ${includes} ${args.join(' ')}`, { cwd: process.cwd(), stdio: [0,1,2], env: env })
}
