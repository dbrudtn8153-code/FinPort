import { NextResponse } from "next/server";
import krStocks from "@/data/kr-stocks.json";

type KrStock = {
    name: string;
    symbol: string;
    market: "KOSPI" | "KOSDAQ" | "ETF";
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

        // 영문 입력: 로컬 JSON에서 티커/이름 먼저 검색
        const upperQuery = query.toUpperCase();
        const localResults = (krStocks as KrStock[])
            .filter(
                (item) =>
                    item.symbol.toUpperCase().includes(upperQuery) ||
                    normalizeText(item.name).includes(normalizeText(query))
            )
            .slice(0, 5)
            .map((item) => ({
                symbol: item.symbol,
                name: item.name,
                market: item.market,
            }));

        // Yahoo Finance 검색
        const res = await fetch(
            `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`,
            {
                headers: { "User-Agent": "Mozilla/5.0" },
                cache: "no-store",
            }
        );

        const data = await res.json();

        const yahooResults =
            data?.quotes
                ?.filter(
                    (item: any) =>
                        item.symbol &&
                        (item.quoteType === "EQUITY" || item.quoteType === "ETF")
                )
                .slice(0, 8)
                .map((item: any) => ({
                    symbol: item.symbol,
                    name: item.shortname || item.longname || item.symbol,
                    market: item.exchDisp || item.exchange || "",
                })) || [];

        // 로컬 결과 우선, Yahoo 결과 뒤에 합치기 (중복 제거)
        const localSymbols = new Set(localResults.map((r) => r.symbol));
        const merged = [
            ...localResults,
            ...yahooResults.filter((r: { symbol: string }) => !localSymbols.has(r.symbol)),
        ].slice(0, 10);

        return NextResponse.json({ results: merged });
    } catch (error) {
        console.error("검색 API 오류:", error);
        return NextResponse.json({ results: [] });
    }
}