import { getUnicodeRanges } from './scripts/get-unicode-ranges';
import { generateSubsettedFont } from './scripts/extract-chars-from-woff';
import { parseArgs } from 'util';
import { promises as fsp } from 'fs';

async function main() {
    const start = performance.now();

    // Clear dist folder
    await fsp.rmdir('./dist', { recursive: true });
    await fsp.mkdir('./dist');

    // Parse arguments
    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            input: {
                type: 'string',
            },
            name: {
                type: 'string',
            },
            weight: {
                type: 'string',
                default: '400',
            },
        },
        strict: true,
        allowPositionals: true,
    });

    if (!values.input || !values.name) {
        console.error('No input file or name specified');
        process.exit(1);
    }

    console.log('Generating font subsets...');

    const unicodeRanges = await getUnicodeRanges();

    const cssChunks: string[] = [];

    await Promise.allSettled(unicodeRanges.map(async (range) => {
        const subset = await generateSubsettedFont(values.input!, range.values);
        if (subset) {
            const hash = Bun.hash(subset);
            const filename = `${values.name}-${hash.toString(16)}.woff`;
            await Bun.write(`./dist/${filename}`, subset);

            cssChunks.push(`@font-face {
    font-family: '${values.name}';
    font-style: normal;
    font-weight: ${values.weight};
    src: url('./${filename}') format('woff2');
    unicode-range: ${range.range};
}\n`);
        }
    }));

    await Bun.write('./dist/font.css', cssChunks.join('\n'));

    const end = performance.now();
    console.log(`Done in ${Math.round((end - start) / 10) / 100}s`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
