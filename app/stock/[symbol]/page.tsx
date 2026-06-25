"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type StockDetail = {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: string;
    high52: number;
    low52: number;
    volume: string;
    per: number;
    pbr: number;
    dividendYield: number;
    roe: number;
    currency: "KRW" | "USD";
};

export default function StockDetailPage() {
    const params = useParams();
    const symbol = decodeURIComponent(params.symbol as string).toUpperCase();

    const [stock, setStock] = useState<StockDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    function formatPrice(value: number, currency: "KRW" | "USD") {
        if (currency === "KRW") return `₩${Math.round(value).toLocaleString()}`;
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

    useEffect(() => {
        async function fetchStock() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
                const json = await res.json();
                if (json.error) {
                    setError(json.error);
                } else {
                    setStock(json);
                }
            } catch {
                setError("데이터를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        }
        fetchStock();
    }, [symbol]);

    const isKrw = stock?.currency === "KRW";
    const isPositive = (stock?.change ?? 0) >= 0;

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href="/"><div className="cursor-pointer"><h1 className="text-2xl font-bold hover:text-blue-600">FinPort</h1><p className="text-sm text-slate-500">종목 상세</p></div></Link>
                    <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
                        <a href="/" className="hover:text-blue-600">ETF 비교</a>
                        <a href="/dividend" className="hover:text-blue-600">배당 계산기</a>
                        <a href="/portfolio" className="hover:text-blue-600">포트폴리오</a>
                    </nav>
                </div>
            </header>

            <section className="mx-auto max-w-4xl px-6 py-8">
                <Link href="/portfolio" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600">
                    ← 포트폴리오로 돌아가기
                </Link>

                {loading && (
                    <div className="mt-8 text-center text-slate-500">데이터 불러오는 중...</div>
                )}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">{error}</div>
                )}

                {stock && (
                    <div className="mt-6 space-y-4">
                        {/* 종목 헤더 */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-3xl font-bold">{stock.name}</h2>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isKrw ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
                                            {isKrw ? "한국" : "미국"}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500">{stock.symbol}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">{formatPrice(stock.price, stock.currency)}</div>
                                    <div className={`mt-1 text-sm font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                                        {isPositive ? "▲" : "▼"} {formatPrice(Math.abs(stock.change), stock.currency)} ({Math.abs(stock.changePercent).toFixed(2)}%)
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">시가총액</div>
                                    <div className="mt-1 text-lg font-bold">{stock.marketCap}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">거래량</div>
                                    <div className="mt-1 text-lg font-bold">{stock.volume}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">52주 최고</div>
                                    <div className="mt-1 text-lg font-bold">{formatPrice(stock.high52, stock.currency)}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">52주 최저</div>
                                    <div className="mt-1 text-lg font-bold">{formatPrice(stock.low52, stock.currency)}</div>
                                </div>
                            </div>
                        </div>

                        {/* 주요 재무지표 */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h3 className="text-xl font-bold mb-4">주요 재무지표</h3>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">PER</div>
                                    <div className="mt-1 text-lg font-bold">{stock.per > 0 ? `${stock.per.toFixed(1)}x` : "-"}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">PBR</div>
                                    <div className="mt-1 text-lg font-bold">{stock.pbr > 0 ? `${stock.pbr.toFixed(2)}x` : "-"}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">배당수익률</div>
                                    <div className="mt-1 text-lg font-bold">{stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : "-"}</div>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4">
                                    <div className="text-xs text-slate-500">ROE</div>
                                    <div className="mt-1 text-lg font-bold">{stock.roe > 0 ? `${stock.roe.toFixed(1)}%` : "-"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}