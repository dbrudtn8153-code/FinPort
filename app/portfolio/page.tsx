"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

type HoldingInput = {
  id: number;
  symbol: string;
  quantity: string;
  avgPrice: string;
  targetWeight: string;
};

type PriceItem = {
  symbol: string;
  name: string;
  price: number;
};

type HoldingResult = {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  profitLoss: number;
  returnRate: number;
  currency: "KRW" | "USD";
  costBasisKrw: number;
  marketValueKrw: number;
  profitLossKrw: number;
};

type SearchResult = {
  symbol: string;
  name: string;
  market?: string;
};

type RebalanceSuggestion = {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  diffKrw: number;
  shares: number;
  shareUnitText: string;
  isCash?: boolean;
};

type SearchInputProps = {
  item: HoldingInput;
  updateHolding: (
    id: number,
    field: "symbol" | "quantity" | "avgPrice" | "targetWeight",
    value: string
  ) => void;
};

function SearchInput({ item, updateHolding }: SearchInputProps) {
  const [query, setQuery] = useState(item.symbol);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item.symbol) setQuery("");
  }, [item.symbol]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSearch(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      updateHolding(item.id, "symbol", "");
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const json = await res.json();
        setResults(json.results || []);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 300);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder="종목명 또는 티커"
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((result) => (
            <button
              type="button"
              key={`${result.symbol}-${result.name}`}
              onClick={() => {
                updateHolding(item.id, "symbol", result.symbol);
                setQuery(result.name);
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{result.name}</span>
                {result.market && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                    ${result.market === "KOSPI" ? "bg-blue-100 text-blue-600" :
                      result.market === "KOSDAQ" ? "bg-purple-100 text-purple-600" :
                        result.market === "ETF" ? "bg-emerald-100 text-emerald-600" :
                          "bg-slate-100 text-slate-500"}`}>
                    {result.market}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">{result.symbol}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  function getCurrency(symbol: string): "KRW" | "USD" {
    if (symbol.includes(".KS") || symbol.includes(".KQ")) return "KRW";
    return "USD";
  }

  function formatCurrency(value: number, currency: "KRW" | "USD") {
    if (currency === "KRW") return `₩${Math.round(value).toLocaleString()}`;
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const defaultHoldings: HoldingInput[] = [
    { id: 1, symbol: "VOO", quantity: "10", avgPrice: "500", targetWeight: "40" },
    { id: 2, symbol: "QQQ", quantity: "5", avgPrice: "450", targetWeight: "30" },
  ];

  const [holdings, setHoldings] = useState<HoldingInput[]>(defaultHoldings);
  const [cashAmount, setCashAmount] = useState("0");
  const [cashTargetWeight, setCashTargetWeight] = useState("30");
  const [results, setResults] = useState<HoldingResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [usdToKrw, setUsdToKrw] = useState<number>(1350);

  useEffect(() => {
    const savedHoldings = localStorage.getItem("portfolio-holdings");
    const savedCashAmount = localStorage.getItem("portfolio-cash-amount");
    const savedCashTargetWeight = localStorage.getItem("portfolio-cash-target-weight");
    if (savedHoldings) {
      try {
        const parsed = JSON.parse(savedHoldings);
        if (Array.isArray(parsed) && parsed.length > 0) setHoldings(parsed);
      } catch (error) {
        console.error("저장된 포트폴리오 불러오기 실패:", error);
      }
    }
    if (savedCashAmount !== null) setCashAmount(savedCashAmount);
    if (savedCashTargetWeight !== null) setCashTargetWeight(savedCashTargetWeight);
  }, []);

  useEffect(() => { localStorage.setItem("portfolio-holdings", JSON.stringify(holdings)); }, [holdings]);
  useEffect(() => { localStorage.setItem("portfolio-cash-amount", cashAmount); }, [cashAmount]);
  useEffect(() => { localStorage.setItem("portfolio-cash-target-weight", cashTargetWeight); }, [cashTargetWeight]);

  useEffect(() => {
    async function loadExchangeRate() {
      try {
        const res = await fetch("/api/exchange-rate");
        const json = await res.json();
        if (json.usdToKrw) setUsdToKrw(json.usdToKrw);
      } catch (error) {
        console.error("환율 불러오기 실패:", error);
      }
    }
    loadExchangeRate();
  }, []);

  function addHolding() {
    setHoldings((prev) => [...prev, { id: Date.now(), symbol: "", quantity: "", avgPrice: "", targetWeight: "" }]);
  }

  function removeHolding(id: number) {
    setHoldings((prev) => prev.filter((item) => item.id !== id));
  }

  function resetPortfolio() {
    setHoldings(defaultHoldings);
    setCashAmount("0");
    setCashTargetWeight("30");
    setResults([]);
    setMessage("");
    localStorage.removeItem("portfolio-holdings");
    localStorage.removeItem("portfolio-cash-amount");
    localStorage.removeItem("portfolio-cash-target-weight");
  }

  function updateHolding(id: number, field: "symbol" | "quantity" | "avgPrice" | "targetWeight", value: string) {
    setHoldings((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  async function calculatePortfolio() {
    setLoading(true);
    setMessage("");
    try {
      const normalizedHoldings = holdings.map((item) => ({
        ...item,
        symbol: item.symbol.trim().toUpperCase(),
        quantity: Number(item.quantity),
        avgPrice: Number(item.avgPrice),
        targetWeight: Number(item.targetWeight),
      }));
      const cashValue = Number(cashAmount);
      const cashTarget = Number(cashTargetWeight);

      if (normalizedHoldings.some((item) => !item.symbol)) {
        setResults([]); setMessage("종목을 입력한 뒤 검색 결과를 클릭해서 선택해주세요."); setLoading(false); return;
      }
      if (normalizedHoldings.some((item) => !/^[A-Z0-9.\-]+$/.test(item.symbol))) {
        setResults([]); setMessage("종목명을 입력한 뒤 검색 결과를 클릭해서 선택해주세요."); setLoading(false); return;
      }
      if (normalizedHoldings.some((item) => Number.isNaN(item.quantity) || Number.isNaN(item.avgPrice) || item.quantity <= 0 || item.avgPrice <= 0)) {
        setResults([]); setMessage("수량과 평균 매수가는 0보다 큰 숫자로 입력해주세요."); setLoading(false); return;
      }
      if (normalizedHoldings.some((item) => Number.isNaN(item.targetWeight) || item.targetWeight < 0 || item.targetWeight > 100)) {
        setResults([]); setMessage("종목 목표 비중은 0 이상 100 이하 숫자로 입력해주세요."); setLoading(false); return;
      }
      if (Number.isNaN(cashValue) || cashValue < 0) {
        setResults([]); setMessage("현금 금액은 0 이상의 숫자로 입력해주세요."); setLoading(false); return;
      }
      if (Number.isNaN(cashTarget) || cashTarget < 0 || cashTarget > 100) {
        setResults([]); setMessage("현금 목표 비중은 0 이상 100 이하 숫자로 입력해주세요."); setLoading(false); return;
      }

      const symbolCounts = normalizedHoldings.reduce((acc, item) => {
        acc[item.symbol] = (acc[item.symbol] || 0) + 1; return acc;
      }, {} as Record<string, number>);
      const duplicateSymbols = Object.keys(symbolCounts).filter((s) => symbolCounts[s] > 1);
      if (duplicateSymbols.length > 0) {
        setResults([]); setMessage(`중복된 티커가 있습니다: ${duplicateSymbols.join(", ")}`); setLoading(false); return;
      }

      const totalTargetWeight = normalizedHoldings.reduce((sum, item) => sum + item.targetWeight, 0) + cashTarget;
      if (Math.round(totalTargetWeight * 10) / 10 !== 100) {
        setResults([]); setMessage(`목표 비중 합계가 100%가 아닙니다. 현재 합계: ${totalTargetWeight}%`); setLoading(false); return;
      }

      const symbols = normalizedHoldings.map((item) => item.symbol).join(",");
      const res = await fetch(`/api/etf?symbols=${symbols}`);
      const json = await res.json();

      if (!json.results || json.results.length === 0) {
        setResults([]); setMessage("현재가 데이터를 불러오지 못했습니다."); setLoading(false); return;
      }

      const priceMap = new Map<string, PriceItem>();
      json.results.forEach((item: PriceItem) => priceMap.set(item.symbol, item));

      const calculated: HoldingResult[] = normalizedHoldings.map((item) => {
        const quote = priceMap.get(item.symbol);
        const currentPrice = quote?.price ?? 0;
        const name = quote?.name ?? item.symbol;
        const costBasis = item.quantity * item.avgPrice;
        const marketValue = item.quantity * currentPrice;
        const profitLoss = marketValue - costBasis;
        const returnRate = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
        const currency = getCurrency(item.symbol);
        const costBasisKrw = currency === "USD" ? costBasis * usdToKrw : costBasis;
        const marketValueKrw = currency === "USD" ? marketValue * usdToKrw : marketValue;
        const profitLossKrw = marketValueKrw - costBasisKrw;
        return { id: item.id, symbol: item.symbol, name, quantity: item.quantity, avgPrice: item.avgPrice, currentPrice, costBasis, marketValue, profitLoss, returnRate, currency, costBasisKrw, marketValueKrw, profitLossKrw };
      });

      setResults(calculated);
      const missingSymbols = normalizedHoldings.filter((item) => !priceMap.has(item.symbol)).map((item) => item.symbol);
      if (missingSymbols.length > 0) setMessage(`현재가를 찾지 못한 티커가 있습니다: ${missingSymbols.join(", ")}`);
    } catch {
      setResults([]); setMessage("포트폴리오 계산 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const cashValueKrw = useMemo(() => { const value = Number(cashAmount); return Number.isNaN(value) ? 0 : value; }, [cashAmount]);

  const summary = useMemo(() => {
    const holdingsCostBasisKrw = results.reduce((sum, item) => sum + item.costBasisKrw, 0);
    const holdingsMarketValueKrw = results.reduce((sum, item) => sum + item.marketValueKrw, 0);
    const totalCostBasisKrw = holdingsCostBasisKrw + cashValueKrw;
    const totalMarketValueKrw = holdingsMarketValueKrw + cashValueKrw;
    const totalProfitLossKrw = totalMarketValueKrw - totalCostBasisKrw;
    const totalReturnRate = totalCostBasisKrw > 0 ? (totalProfitLossKrw / totalCostBasisKrw) * 100 : 0;
    return { totalCostBasisKrw, totalMarketValueKrw, totalProfitLossKrw, totalReturnRate, cashValueKrw };
  }, [results, cashValueKrw]);

  const totalTargetWeight = useMemo(() => {
    return holdings.reduce((sum, item) => sum + Number(item.targetWeight || 0), 0) + Number(cashTargetWeight || 0);
  }, [holdings, cashTargetWeight]);

  const weights = useMemo(() => {
    const holdingWeights = results.map((item) => ({
      symbol: item.symbol, name: item.name,
      weight: summary.totalMarketValueKrw > 0 ? (item.marketValueKrw / summary.totalMarketValueKrw) * 100 : 0,
    }));
    if (summary.cashValueKrw > 0) {
      holdingWeights.push({ symbol: "CASH", name: "현금", weight: summary.totalMarketValueKrw > 0 ? (summary.cashValueKrw / summary.totalMarketValueKrw) * 100 : 0 });
    }
    return holdingWeights;
  }, [results, summary.totalMarketValueKrw, summary.cashValueKrw]);

  const chartData = useMemo(() => weights.map((w) => ({ name: w.symbol, value: Number(w.weight.toFixed(1)) })), [weights]);
  const COLORS = ["#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#64748b"];

  const style = useMemo(() => {
    const qqqWeight = weights.find((w) => w.symbol === "QQQ")?.weight || 0;
    const cashWeight = weights.find((w) => w.symbol === "CASH")?.weight || 0;
    if (cashWeight >= 20) return "방어형 (현금 비중 높음)";
    if (qqqWeight > 40) return "공격형 (성장주 비중 높음)";
    return "안정형 (분산형 포트폴리오)";
  }, [weights]);

  const recommendation = useMemo(() => {
    if (weights.length === 0) return "";
    const qqq = weights.find((w) => w.symbol === "QQQ")?.weight || 0;
    const voo = weights.find((w) => w.symbol === "VOO")?.weight || 0;
    const cash = weights.find((w) => w.symbol === "CASH")?.weight || 0;
    const loss = summary.totalReturnRate;
    if (loss < -20) return "현재 큰 손실 상태입니다. 비중 문제보다 진입 시점이나 시장 상황 점검이 필요합니다.";
    if (loss < -10) return "손실이 발생하고 있습니다. 포트폴리오 구조 또는 투자 시점을 점검해보세요.";
    if (cash >= 30) return "현금 비중이 높아 방어적인 포트폴리오입니다. 추가 매수 기회를 기다리는 전략에 가깝습니다.";
    if (qqq > 50) return "QQQ 비중이 매우 높아 변동성이 큰 공격적인 포트폴리오입니다.";
    if (voo > 50) return "VOO 중심의 안정적인 포트폴리오입니다. 장기 투자에 적합합니다.";
    if (weights.length === 1) return "단일 자산에 집중되어 있습니다. 분산을 고려해보세요.";
    return "적절히 분산된 포트폴리오입니다.";
  }, [weights, summary.totalReturnRate]);

  const rebalanceSuggestions = useMemo<RebalanceSuggestion[]>(() => {
    if (summary.totalMarketValueKrw <= 0) return [];
    const stockSuggestions: RebalanceSuggestion[] = results.map((item) => {
      const holding = holdings.find((h) => h.symbol.trim().toUpperCase() === item.symbol);
      const targetWeight = Number(holding?.targetWeight || 0);
      if (targetWeight <= 0) return null;
      const currentWeight = (item.marketValueKrw / summary.totalMarketValueKrw) * 100;
      const targetValueKrw = (summary.totalMarketValueKrw * targetWeight) / 100;
      const diffKrw = targetValueKrw - item.marketValueKrw;
      const priceKrw = item.currency === "USD" ? item.currentPrice * usdToKrw : item.currentPrice;
      const rawShares = priceKrw > 0 ? diffKrw / priceKrw : 0;
      const shares = item.currency === "KRW" ? Math.round(rawShares) : Number(rawShares.toFixed(2));
      const shareUnitText = item.currency === "KRW" ? `${Math.abs(shares).toLocaleString()}주` : `${Math.abs(shares).toFixed(2)}주`;
      return { symbol: item.symbol, name: item.name, currentWeight, targetWeight, diffKrw, shares, shareUnitText };
    }).filter((item): item is RebalanceSuggestion => item !== null);

    const cashTarget = Number(cashTargetWeight || 0);
    if (cashTarget > 0) {
      const currentCashWeight = summary.totalMarketValueKrw > 0 ? (summary.cashValueKrw / summary.totalMarketValueKrw) * 100 : 0;
      const targetCashValueKrw = (summary.totalMarketValueKrw * cashTarget) / 100;
      const cashDiffKrw = targetCashValueKrw - summary.cashValueKrw;
      stockSuggestions.push({ symbol: "CASH", name: "현금", currentWeight: currentCashWeight, targetWeight: cashTarget, diffKrw: cashDiffKrw, shares: 0, shareUnitText: "-", isCash: true });
    }
    return stockSuggestions;
  }, [results, holdings, summary.totalMarketValueKrw, summary.cashValueKrw, usdToKrw, cashTargetWeight]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/"><div className="cursor-pointer"><h1 className="text-2xl font-bold hover:text-blue-600">FinPort</h1><p className="text-sm text-slate-500">포트폴리오 수익률 계산</p></div></Link>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="/" className="hover:text-blue-600">ETF 비교</a>
            <a href="/dividend" className="hover:text-blue-600">배당 계산기</a>
            <a href="/portfolio" className="hover:text-blue-600">포트폴리오</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 px-8 py-12 text-white shadow-xl md:px-12">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-1 text-sm">Portfolio · Return · Rebalancing</div>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">내 포트폴리오를<br />실전용으로 관리해보세요</h2>
            <p className="mt-4 text-base text-slate-300 md:text-lg">종목명 검색, 목표 비중, 현금 비중까지 반영해 실전형 리밸런싱을 계산합니다.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">보유 종목 입력</h3>
              <p className="mt-1 text-slate-500">종목명 또는 티커, 수량, 평균 매수가, 목표 비중을 입력하세요.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={addHolding} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">종목 추가</button>
              <button onClick={resetPortfolio} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">초기화</button>
            </div>
          </div>

          <div className="mb-3 hidden gap-3 px-2 text-sm font-semibold text-slate-500 md:grid md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <div>종목</div><div>수량</div><div>평균 매수가</div><div>목표 비중 (%)</div><div></div>
          </div>

          <div className="space-y-4">
            {holdings.map((item) => (
              <div key={item.id} className="grid items-center gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <div><label className="mb-2 block text-sm font-medium text-slate-600 md:hidden">종목</label><SearchInput item={item} updateHolding={updateHolding} /></div>
                <div><label className="mb-2 block text-sm font-medium text-slate-600 md:hidden">수량</label><input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateHolding(item.id, "quantity", e.target.value)} placeholder="예: 10" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-slate-600 md:hidden">평균 매수가</label><input type="number" min="0" step="0.01" value={item.avgPrice} onChange={(e) => updateHolding(item.id, "avgPrice", e.target.value)} placeholder="예: 500 또는 210000" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></div>
                <div><label className="mb-2 block text-sm font-medium text-slate-600 md:hidden">목표 비중 (%)</label><input type="number" min="0" step="1" value={item.targetWeight} onChange={(e) => updateHolding(item.id, "targetWeight", e.target.value)} placeholder="예: 25" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></div>
                <div className="flex items-end"><button onClick={() => removeHolding(item.id)} className="w-full rounded-xl border border-red-200 px-4 py-3 text-red-600 hover:bg-red-50">삭제</button></div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-lg font-bold">현금 설정</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><label className="mb-2 block text-sm font-medium text-slate-600">현금 금액 (KRW)</label><input type="number" min="0" step="1" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="예: 1000000" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-600">현금 목표 비중 (%)</label><input type="number" min="0" step="1" value={cashTargetWeight} onChange={(e) => setCashTargetWeight(e.target.value)} placeholder="예: 20" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" /></div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-500">목표 비중 합계: {totalTargetWeight}%</div>
          <div className="mt-6">
            <button onClick={calculatePortfolio} disabled={loading} className="rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {loading ? "계산 중..." : "포트폴리오 계산하기"}
            </button>
          </div>
          {message && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">{message}</div>}
        </div>
      </section>

      {results.length > 0 && (
        <>
          <section className="mx-auto max-w-6xl px-6 py-8">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">총 투자원금 (KRW)</div><div className="mt-2 text-3xl font-bold">{formatCurrency(summary.totalCostBasisKrw, "KRW")}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">총 평가금액 (KRW)</div><div className="mt-2 text-3xl font-bold">{formatCurrency(summary.totalMarketValueKrw, "KRW")}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">총 평가손익 (KRW)</div><div className={`mt-2 text-3xl font-bold ${summary.totalProfitLossKrw >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(summary.totalProfitLossKrw, "KRW")}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">총 수익률</div><div className={`mt-2 text-3xl font-bold ${summary.totalReturnRate >= 0 ? "text-emerald-600" : "text-red-600"}`}>{summary.totalReturnRate.toFixed(2)}%</div></div>
            </div>

            <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="text-sm font-semibold text-blue-600">💡 포트폴리오 분석</div>
              <div className="mt-2 text-slate-700">현재 포트폴리오는 <span className="font-semibold">{style}</span> 입니다.</div>

              <div className="mt-6 h-64 w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      <Label value={formatCurrency(summary.totalMarketValueKrw, "KRW")} position="center" className="fill-slate-800 text-base font-bold" />
                      {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">{recommendation}</div>

              <div className="mt-4 space-y-2 text-sm">
                {chartData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-slate-500">{item.value}%</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-800">리밸런싱 추천</div>
                <div className="mt-3 space-y-3">
                  {rebalanceSuggestions.length > 0 ? rebalanceSuggestions.map((item) => (
                    <div key={item.symbol} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                      <div><div className="font-semibold text-slate-800">{item.name}</div><div className="text-xs text-slate-500">{item.symbol}</div></div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">현재 {item.currentWeight.toFixed(1)}% → 목표 {item.targetWeight}%</div>
                        {item.isCash ? (
                          <div className={`mt-1 text-sm font-semibold ${item.diffKrw >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {item.diffKrw >= 0 ? "현금 비중 확대" : "현금 투입"} {formatCurrency(Math.abs(item.diffKrw), "KRW")}
                          </div>
                        ) : (
                          <div className={`mt-1 text-sm font-semibold ${item.diffKrw >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {item.diffKrw >= 0 ? "추가 매수" : "비중 축소"} {item.shareUnitText}
                            <span className="ml-2 text-xs text-slate-500">({formatCurrency(Math.abs(item.diffKrw), "KRW")})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : <div className="text-sm text-slate-500">목표 비중을 입력한 자산이 없습니다.</div>}
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">적용 환율: 1 USD = ₩{usdToKrw.toLocaleString()}</p>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6"><h3 className="text-2xl font-bold">보유 종목 상세</h3><p className="mt-1 text-slate-500">개별 종목은 원래 통화로 표시하고, 총합은 KRW 기준으로 계산합니다.</p></div>
              <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="font-semibold text-slate-800">현금</div>
                <div className="mt-1 text-sm text-slate-500">현재 보유 현금</div>
                <div className="mt-2 text-xl font-bold">{formatCurrency(summary.cashValueKrw, "KRW")}</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-sm text-slate-500">
                      <th className="px-4">종목</th><th className="px-4">보유 수량</th><th className="px-4">평균 매수가</th><th className="px-4">현재가</th><th className="px-4">투자원금</th><th className="px-4">평가금액</th><th className="px-4">평가손익</th><th className="px-4">수익률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => (
                      <tr key={item.id} className="rounded-2xl bg-slate-50">
                        <td className="rounded-l-2xl px-4 py-4"><div className="font-semibold">{item.name}</div><div className="text-xs text-slate-500">{item.symbol}</div></td>
                        <td className="px-4 py-4">{item.quantity}</td>
                        <td className="px-4 py-4">{formatCurrency(item.avgPrice, item.currency)}</td>
                        <td className="px-4 py-4">{formatCurrency(item.currentPrice, item.currency)}</td>
                        <td className="px-4 py-4">{formatCurrency(item.costBasis, item.currency)}</td>
                        <td className="px-4 py-4">{formatCurrency(item.marketValue, item.currency)}</td>
                        <td className={`px-4 py-4 font-semibold ${item.profitLoss >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(item.profitLoss, item.currency)}</td>
                        <td className={`rounded-r-2xl px-4 py-4 font-semibold ${item.returnRate >= 0 ? "text-emerald-600" : "text-red-600"}`}>{item.returnRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}