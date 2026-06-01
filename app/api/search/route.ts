import { NextResponse } from "next/server";
import krStocks from "@/data/kr-stocks.json";

type KrStock = {
    name: string;
    symbol: string;
    market: "KOSPI" | "KOSDAQ";
};

function isKoreanQuery(query: string) {
    return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query);
}

function normalizeText(text: string) {
    return text.replace(/\s+/g, "").toLowerCase();
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        if (isKoreanQuery(query)) {
            const normalizedQuery = normalizeText(query);

            const results = (krStocks as KrStock[])
                .filter((item) =>
                    normalizeText(item.name).includes(normalizedQuery)
                )
                .slice(0, 10)
                .map((item) => ({
                    symbol: item.symbol,
                    name: item.name,
                    market: item.market,
                }));

            return NextResponse.json({ results });
        }

        const res = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
                query
            )}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
                cache: "no-store",
            }
        );

        const data = await res.json();

        const results =
            data?.quotes
                ?.filter(
                    (item: any) =>
                        item.symbol &&
                        (item.quoteType === "EQUITY" || item.quoteType === "ETF")
                )
                .slice(0, 10)
                .map((item: any) => ({
                    symbol: item.symbol,
                    name: item.shortname || item.longname || item.symbol,
                    market: item.exchDisp || item.exchange || "",
                })) || [];

        return NextResponse.json({ results });
    } catch (error) {
        console.error("검색 API 오류:", error);
        return NextResponse.json({ results: [] });
    }
}