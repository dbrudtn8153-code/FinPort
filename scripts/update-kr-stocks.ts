import fs from "node:fs/promises";
import path from "node:path";

type KrStock = {
    name: string;
    symbol: string;
    market: "KOSPI" | "KOSDAQ";
};

async function main() {
    const stocks: KrStock[] = [
        { name: "삼성전자", symbol: "005930.KS", market: "KOSPI" },
        { name: "SK하이닉스", symbol: "000660.KS", market: "KOSPI" },
        { name: "NAVER", symbol: "035420.KS", market: "KOSPI" },
        { name: "카카오", symbol: "035720.KS", market: "KOSPI" },
        { name: "빛과전자", symbol: "069540.KQ", market: "KOSDAQ" },
        { name: "보원케미칼", symbol: "024070.KS", market: "KOSPI" },
    ];

    const deduped = Array.from(
        new Map(stocks.map((item) => [item.symbol, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name, "ko"));

    const outPath = path.join(process.cwd(), "data", "kr-stocks.json");

    await fs.writeFile(outPath, JSON.stringify(deduped, null, 2), "utf-8");

    console.log(`국내 종목 ${deduped.length}개 저장 완료: ${outPath}`);
}

main().catch((error) => {
    console.error("kr-stocks.json 생성 실패:", error);
    process.exit(1);
});