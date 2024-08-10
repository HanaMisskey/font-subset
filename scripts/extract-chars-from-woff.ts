import { promises as fsp } from 'fs';
//@ts-ignore
import { convert } from 'fontverter';
import { ttf2woff } from 'wasm-ttf2woff';

export async function generateSubsettedFont(woffPath: string, unicodeRangeValues: Map<string, number[]>) {
    const font = await fsp.readFile(woffPath);

    const {
        instance: { exports },
    }: any = await WebAssembly.instantiate(await fsp.readFile(require.resolve('harfbuzzjs/hb-subset.wasm')), {});

    // @ts-ignore
    const heapu8 = new Uint8Array(exports.memory.buffer);

    const ttf = await convert(font, 'truetype') as Buffer;

    const subsetFonts = new Map<string, Buffer>();

    let i = 0;
    for (const [key, unicodeValues] of unicodeRangeValues) {
        i++;
        console.log(`Generating subset ${i} of ${unicodeRangeValues.size}...`);

        // サブセット入力を作成
        const input = exports.hb_subset_input_create_or_fail();
        if (input === 0) {
            throw new Error('hb_subset_input_create_or_fail (harfbuzz) returned zero, indicating failure');
        }

        // フォントバッファにフォントデータをセット
        const fontBuffer = exports.malloc(ttf.byteLength);
        heapu8.set(new Uint8Array(ttf), fontBuffer);

        // フォントフェイスを作成
        const blob = exports.hb_blob_create(fontBuffer, ttf.byteLength, 2, 0, 0);
        const face = exports.hb_face_create(blob, 0);
        exports.hb_blob_destroy(blob);

        // Unicodeセットに指定されたUnicodeポイントを追加
        const inputUnicodes = exports.hb_subset_input_unicode_set(input);
        for (const unicode of unicodeValues) {
            exports.hb_set_add(inputUnicodes, unicode);
        }

        // サブセットを作成
        let subset;
        try {
            subset = exports.hb_subset_or_fail(face, input);
            if (subset === 0) {
                exports.hb_face_destroy(face);
                exports.free(fontBuffer);
                throw new Error('hb_subset_or_fail (harfbuzz) returned zero, indicating failure');
            }
        } finally {
            exports.hb_subset_input_destroy(input);
        }

        // サブセットフォントデータを取得
        const result = exports.hb_face_reference_blob(subset);
        const offset = exports.hb_blob_get_data(result, 0);
        const subsetByteLength = exports.hb_blob_get_length(result);
        if (subsetByteLength === 0) {
            exports.hb_face_destroy(face);
            exports.hb_blob_destroy(result);
            exports.free(fontBuffer);
            throw new Error('hb_blob_get_length (harfbuzz) returned zero, indicating failure');
        }

        // サブセットフォントをバッファに格納
        subsetFonts.set(key, Buffer.from(await ttf2woff(heapu8.slice(offset, offset + subsetByteLength))));

        // メモリを解放
        exports.hb_blob_destroy(result);
        exports.hb_face_destroy(subset);
        exports.hb_face_destroy(face);
        exports.free(fontBuffer);
    }

    return subsetFonts;
}
