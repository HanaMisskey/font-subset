export async function getUnicodeRanges() {
    const notoSansJPCSS = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400&display=swap', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        }
    });
    const unicodeRangeRegex = /unicode-range:\s*([^;]+);/gm;
    const unicodeRegex = /U\+([-0-9a-fA-F]+)/g;
    const unicodeRanges = [];

    if (notoSansJPCSS.ok) {
        const cssText = await notoSansJPCSS.text();
        let match;
        while ((match = unicodeRangeRegex.exec(cssText)) !== null) {
            const unicodeRange = match[1];
            const rangeChunks = unicodeRange.split(',').map((rangeChunk) => rangeChunk.trim());

            const values = rangeChunks.flatMap((rangeChunk) => {
                const hexes = unicodeRegex.exec(rangeChunk);
                if (hexes === null) {
                    return [];
                }
                const [start, end] = hexes[1].split('-').map((hexes) => parseInt(hexes, 16));
                if (hexes.includes('-')) {
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                } else {
                    return [parseInt(hexes[1], 16)];
                }
            });

            unicodeRanges.push({
                range: unicodeRange,
                values,
            });
        }
    }

    return unicodeRanges;
}
