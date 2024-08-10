type UnicodeRange = {
    range: string;
    values: number[];
};

export async function getUnicodeRanges() {
    const notoSansJPCSS = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        }
    });
    const unicodeRangeRegex = /unicode-range:\s*([^;]+);/g;
    const unicodeRanges: UnicodeRange[] = [];

    if (notoSansJPCSS.ok) {
        const cssText = await notoSansJPCSS.text();
        [...cssText.matchAll(unicodeRangeRegex)].forEach((match) => {
            const unicodeRange = match[1];
            const rangeChunks = unicodeRange.split(',').map((rangeChunk) => rangeChunk.trim());

            const values = rangeChunks.flatMap((rangeChunk) => {
                const hexes = rangeChunk.replace('U+', '');
                if (hexes.includes('-')) {
                    const ranges = hexes.split('-').map((hex) => parseInt(hex, 16));
                    const start = Math.min(...ranges);
                    const end = Math.max(...ranges);
                    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                    return range;
                } else {
                    return [parseInt(hexes, 16)];
                }
            });

            unicodeRanges.push({
                range: unicodeRange,
                values,
            });
        });
    }

    return unicodeRanges;
}
