# idris-naps

[![Total downloads](https://img.shields.io/npm/dt/idris-naps.svg)](http://www.npmjs.com/package/idris-naps)
[![MIT license](https://img.shields.io/npm/l/idris-naps.svg)](https://github.com/Risto-Stevcev/idris-naps/LICENSE)

*Naps is **n**ot **a** **p**ackage management **s**ystem*

A makeshift package management system for idris


## Usage

Install naps:

```sh
$ npm install -g idris-naps
```

1. Add a bower.json file in your project directory
2. Install and save any dependencies that you might need. The dependencies don't need to have a bower.json file, since 
bower can install git repos. For example, if your project needs IdrisScript, you can type:

```sh
$ bower install https://github.com/idris-hackers/IdrisScript.git --save
```

Don't forget to also list them as dependencies in your idris `ipkg` file under `pkgs = ...`

3. Run `naps --install-deps` to install the packages that you declared as dependencies. Naps will package them up in the 
`libs` folder

4. Use the `naps` command as you would the `idris` command. Ex:

```sh
$ naps --build my-package.ipkg
$ naps --checkpkg my-package.ipkg
$ naps --testpkg my-package.ipkg
```
If you need to specify a specific location for the idris binary, populate the `IDRIS_BINARY_PATH` environment variable 


## How it works

Naps uses bower to manage packages, much like purescript does. Bower uses a flat dependency tree so it works out well.
Currently idris has no way of referring to dev dependencies in `ipkg` files separately, so naps ignores `devDependencies` in 
the `bower.json` files. Use `dependencies` for both dev and prod dependencies for now

When `naps --install-deps` runs, it sets the `IDRIS_LIBRARY_PATH` to the `libs` directory of the location where naps is run. 
It will read the `bower.json` in the directory for `dependencies`, run `bower install` to install them if they aren't 
already there, and then have idris install the packages into the `libs` folder one by one. If the `IDRIS_LIBRARY_PATH` 
was set before naps was run, it will include libraries in that path as well in case they are dependencies, such as 
`prelude`, or `contrib`. If it wasn't set, then it will try to include the default for idris, which is currently 
`/usr/share/idris/libs`.

If `naps` is run with any other flag or command line arguments, it will just provide a wrapper around the `idris` 
command so that it does something like:

```
$ IDRIS_LIBRARY_PATH=/present/working/dir/libs idris -i /usr/share/idris/libs/prelude -i /usr/share/idris/libs/contrib ...
```

where `...` is the rest of the command. If `IDRIS_BINARY_PATH` is supplied as an environment variable to naps, it will 
use that instead of `idris`.
