const path = require('path');
const tsconfig = require('./tsconfig.json');

function getRollupAliases() {
    const { paths } = tsconfig.compilerOptions;

    const aliases = [];
    for (const key in paths) {
        aliases.push({
            find: key,
            replacement: path.resolve(__dirname, paths[key][0])
        });
    }

    return aliases;
}
export default getRollupAliases
