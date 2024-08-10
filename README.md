# font-subset

woff2形式のフォントをNoto Sans JPのサブセット規則に則ってサブセット化するやつ

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts --input "path/to/font.woff2" --name "font-name" --weight 400
```

- `--input` サブセット化する元のフォントファイルのパス
- `--name` サブセット化したフォントの名前
- `--weight` サブセット化したフォントのウェイト（デフォルト: `400`）

実行すると`dist`にサブセット化したフォントとCSSが出力される

This project was created using `bun init` in bun v1.1.17. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
