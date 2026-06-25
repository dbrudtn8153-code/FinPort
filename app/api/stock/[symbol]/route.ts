import krStocks from "@/data/kr-stocks.json";

type KrStock = {
    name: string;
    symbol: string;
    market: string;
};

const krStockMap = new Map(
    (krStocks as KrStock[]).map((item) => [item.symbol, item.name])
);
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol: rawSymbol } = await params;
    const symbol = decodeURIComponent(rawSymbol).toUpperCase();
    try {
        const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`,
            {
                headers: { "User-Agent": "Mozilla/5.0" },
                cache: "no-store",
            }
        );

        const json = await res.json();
        const result = json?.chart?.result?.[0];
        const meta = result?.meta;

        if (!meta) {
            return NextResponse.json({ error: "종목 데이터를 찾을 수 없습니다." }, { status: 404 });
        }
        console.log("meta 확인:", JSON.stringify({
            price: meta?.regularMarketPrice,
            prevClose: meta?.chartPreviousClose,
            previousClose: meta?.previousClose,
            regularMarketPreviousClose: meta?.regularMarketPreviousClose,
            regularMarketOpen: meta?.regularMarketOpen,
        }));

        const currency = symbol.includes(".KS") || symbol.includes(".KQ") ? "KRW" : "USD";

        const marketCapRaw = meta?.marketCap ?? 0;
        const volume = formatVolume(meta?.regularMarketVolume ?? 0);

        const quotes = result?.indicators?.quote?.[0];
        const closes = quotes?.close ?? [];
        const prevClose = closes.length >= 2 ? closes[closes.length - 2] : (meta?.chartPreviousClose ?? 0);
        const currentPrice = meta?.regularMarketPrice ?? 0;
        const change = prevClose > 0 ? currentPrice - prevClose : 0;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

        return NextResponse.json({
            symbol,
            name: krStockMap.get(symbol) || meta?.longName || meta?.shortName || symbol,
            price: currentPrice,
            change,
            changePercent,
            marketCap: marketCapRaw > 0 ? formatMarketCap(marketCapRaw, currency) : "-",
            volume,
            high52: meta?.fiftyTwoWeekHigh ?? 0,
            low52: meta?.fiftyTwoWeekLow ?? 0,
            per: 0,
            pbr: 0,
            dividendYield: 0,
            roe: 0,
            currency,
        });
    } catch (error) {
        console.error("종목 상세 오류:", error);
        return NextResponse.json({ error: "데이터를 불러오지 못했습니다." }, { status: 500 });
    }
}

function formatMarketCap(value: number, currency: "KRW" | "USD") {
    if (currency === "KRW") {
        if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}조`;
        if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`;
        return `₩${value.toLocaleString()}`;
    }
    if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    return `$${value.toLocaleString()}`;
}

function formatVolume(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
}