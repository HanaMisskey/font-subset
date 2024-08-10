import { promises as fsp } from 'fs';
import * as fontkit from 'fontkit';

export async function generateSubsettedFont(woffPath: string, unicodeValues: number[]) {
    const fontBuffer = await fsp.readFile(woffPath);
    const font = fontkit.create(fontBuffer);

    if ('createSubset' in font) {
        const subset = font.createSubset();
        unicodeValues.forEach((unicodeValue) => {
            subset.includeGlyph(font.glyphForCodePoint(unicodeValue));
        });

        return subset.encode();
    }
}
