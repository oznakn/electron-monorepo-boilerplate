#!/usr/bin/env zx

let version = process.env.APP_VERSION;

if (version && version.length >= 1 && version[0] === 'v') {
    version = version.slice(1);
}

const packageJSON = require(path.join(process.cwd(), 'package.json'));
const externals = require(path.join(process.cwd(), 'build/externals.json'));

await $`yarn run clean`;

await $`yarn run build`;

await $`mkdir -p build/code/assets/`;

await $`cp -r dist/ build/code/dist/`;
await $`cp -r node_modules/ build/code/node_modules/`;
await $`cp -r assets/build-assets/ build/code/assets/build-assets/`;
await $`cp -r build/license.txt build/code/license.txt`;

const newPackageJson = {
    name: packageJSON.name,
    description: packageJSON.description,
    author: packageJSON.author,
    version: version || packageJSON.version,
    main: packageJSON.main,
    dependencies: Object.fromEntries(externals.map(s => [s, '*'])),
};

await $`echo ${JSON.stringify(newPackageJson, null, 4)} > build/code/package.json`;

await $`yarn run electron-builder build --publish never`;
