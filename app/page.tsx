"use client";

import { useEffect, useState } from "react";

type EtfItem = {
  symbol: string;
  name: string;
  price: number;
  oneYearReturn: number;
  dividendYield: number;
  expenseRatio: number;
  aum: string;
};

const TIPS = [
  { tip: "분산 투자는 리스크를 줄이는 가장 기본적인 방법입니다. 한 종목에 몰빵하지 마세요.", category: "리스크 관리" },
  { tip: "ETF는 여러 종목에 자동으로 분산 투자되어 초보자에게 적합한 투자 수단입니다.", category: "ETF 기초" },
  { tip: "장기 투자를 할수록 복리 효과가 커져 수익률이 기하급수적으로 늘어납니다.", category: "장기 투자" },
  { tip: "시장 타이밍을 맞추려 하기보다 꾸준히 분할 매수하는 것이 더 효과적입니다.", category: "투자 전략" },
  { tip: "배당 재투자는 복리 효과를 극대화하는 좋은 방법입니다.", category: "배당 투자" },
  { tip: "운용보수(expense ratio)가 낮을수록 장기적으로 더 많은 수익을 가져갈 수 있습니다.", category: "ETF 기초" },
  { tip: "감정적인 매매는 수익률을 낮추는 주요 원인입니다. 원칙을 세우고 지키세요.", category: "투자 심리" },
];

const TERMS = [
  { term: "ETF (상장지수펀드)", desc: "주식처럼 거래소에서 사고팔 수 있는 펀드로, 다양한 종목에 한 번에 투자할 수 있습니다." },
  { term: "배당수익률", desc: "주가 대비 연간 배당금의 비율로, 높을수록 현금 수익이 많다는 의미입니다." },
  { term: "리밸런싱", desc: "목표 비중에서 벗어난 포트폴리오를 원래 비율로 다시 맞추는 작업입니다." },
  { term: "운용보수 (Expense Ratio)", desc: "ETF를 운용하는 데 드는 연간 비용으로, 낮을수록 투자자에게 유리합니다." },
  { term: "시가총액", desc: "주가에 발행 주식 수를 곱한 값으로, 기업의 전체 가치를 나타냅니다." },
  { term: "분산 투자", desc: "여러 자산이나 종목에 나눠 투자해 특정 종목의 하락 위험을 줄이는 전략입니다." },
  { term: "복리 효과", desc: "수익이 원금에 더해져 다시 수익을 만드는 효과로, 시간이 길수록 강력해집니다." },
];

export default function Home() {
  const [left, setLeft] = useState("VOO");
  const [right, setRight] = useState("QQQ");
  const [data, setData] = useState<EtfItem[] | null>(null);
  const [message, setMessage] = useState("");
  const [activeSymbols, setActiveSymbols] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const today = new Date();
  const dayIndex = today.getDate() % TIPS.length;
  const termIndex = today.getDate() % TERMS.length;
  const todayTip = TIPS[dayIndex];
  const todayTerm = TERMS[termIndex];

  async function fetchEtfData(leftValue: string, rightValue: string) {
    const res = await fetch(`/api/etf?symbols=${leftValue},${rightValue}`);
    const json = await res.json();
    if (!json.results || json.results.length === 0) {
      setMessage("일치하는 ETF 데이터가 없습니다.");
      setData(null);
      return;
    }
    if (json.results.length < 2) {
      setMessage("입력한 ETF 중 일부만 찾았습니다.");
    } else {
      setMessage("");
    }
    setData(json.results);
    setLastUpdated(new Date().toLocaleTimeString("ko-KR"));
  }

  async function compare() {
    const leftValue = left.trim().toUpperCase();
    const rightValue = right.trim().toUpperCase();
    if (!leftValue || !rightValue) {
      setMessage("ETF 티커 2개를 모두 입력해주세요.");
      setData(null);
      return;
    }
    setActiveSymbols(`${leftValue},${rightValue}`);
    await fetchEtfData(leftValue, rightValue);
  }

  function setQuickCompare(a: string, b: string) {
    setLeft(a);
    setRight(b);
    setMessage("");
    setData(null);
    setActiveSymbols("");
    setLastUpdated("");
  }

  useEffect(() => {
    if (!activeSymbols) return;
    const [leftValue, rightValue] = activeSymbols.split(",");
    const interval = setInterval(() => {
      fetchEtfData(leftValue, rightValue);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSymbols]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">FinPort</h1>
            <p className="text-sm text-slate-500">ETF 비교 · 배당 · 분석</p>
          </div>
          <nav className="hidden gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="/" className="hover:text-blue-600">ETF 비교</a>
            <a href="/dividend" className="hover:text-blue-600">배당 계산기</a>
            <a href="/portfolio" className="hover:text-blue-600">포트폴리오</a>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-900 px-8 py-12 text-white shadow-xl md:px-12">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-1 text-sm">
              미국 ETF · 배당 ETF · 인기 비교
            </div>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">
              ETF 비교부터 배당 계산까지,<br />투자에 필요한 정보를 한 번에
            </h2>
            <p className="mt-4 text-base text-blue-100 md:text-lg">
              수익률, 배당률, 운용보수, 순자산 규모를 보기 쉽게 비교해보세요.
            </p>
            <div className="mt-8 rounded-2xl bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input value={left} onChange={(e) => setLeft(e.target.value)} placeholder="예: VOO" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
                <div className="text-center text-sm font-bold text-slate-500 md:px-2">VS</div>
                <input value={right} onChange={(e) => setRight(e.target.value)} placeholder="예: QQQ" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500" />
                <button onClick={compare} className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">비교하기</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="/dividend" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">배당 계산기로 이동</a>
                <a href="/portfolio" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">포트폴리오로 이동</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 오늘의 투자 팁 + 오늘의 용어 */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <div className="text-sm font-semibold text-amber-600">오늘의 투자 팁</div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{todayTip.category}</span>
            </div>
            <p className="mt-3 text-slate-700 leading-relaxed">{todayTip.tip}</p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <div className="text-sm font-semibold text-blue-600">오늘의 투자 용어</div>
            </div>
            <div className="mt-3 font-bold text-slate-800">{todayTerm.term}</div>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">{todayTerm.desc}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">인기 비교</h3>
          <p className="text-sm text-slate-500">자주 비교하는 ETF 조합</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <button onClick={() => setQuickCompare("VOO", "QQQ")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-lg font-bold">VOO vs QQQ</div>
            <div className="mt-1 text-sm text-slate-500">대표 성장 ETF 비교</div>
          </button>
          <button onClick={() => setQuickCompare("SCHD", "JEPI")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-lg font-bold">SCHD vs JEPI</div>
            <div className="mt-1 text-sm text-slate-500">배당 ETF 비교</div>
          </button>
          <button onClick={() => setQuickCompare("VOO", "SCHD")} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-lg font-bold">VOO vs SCHD</div>
            <div className="mt-1 text-sm text-slate-500">성장 vs 배당 비교</div>
          </button>
        </div>
      </section>

      {message && (
        <section className="mx-auto max-w-6xl px-6 pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">{message}</div>
        </section>
      )}

      {data && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold">비교 결과</h3>
              <p className="mt-1 text-slate-500">{data[0]?.symbol} 와 {data[1]?.symbol ?? "ETF"} 비교</p>
            </div>
            <div className="text-sm text-slate-500">마지막 업데이트: {lastUpdated || "-"}</div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((etf) => (
              <div key={etf.symbol} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-600">{etf.symbol}</div>
                    <h4 className="mt-1 text-2xl font-bold">{etf.name}</h4>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">ETF</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">현재가</div><div className="mt-1 text-2xl font-bold">${etf.price}</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">1년 수익률</div><div className="mt-1 text-2xl font-bold text-emerald-600">{etf.oneYearReturn}%</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">배당률</div><div className="mt-1 text-xl font-semibold">{etf.dividendYield}%</div></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">운용보수</div><div className="mt-1 text-xl font-semibold">{etf.expenseRatio}%</div></div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">순자산 규모</div><div className="mt-1 text-xl font-semibold">{etf.aum}</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">기능 1</div>
            <h4 className="mt-2 text-xl font-bold">ETF 비교</h4>
            <p className="mt-2 text-slate-500">성장형 ETF와 배당형 ETF를 쉽고 빠르게 비교할 수 있습니다.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">기능 2</div>
            <h4 className="mt-2 text-xl font-bold">배당 계산기</h4>
            <p className="mt-2 text-slate-500">투자금 기준 예상 연 배당과 월 배당을 따로 계산하는 페이지로 이동할 수 있습니다.</p>
            <a href="/dividend" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">배당 계산기 열기</a>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">기능 3</div>
            <h4 className="mt-2 text-xl font-bold">포트폴리오</h4>
            <p className="mt-2 text-slate-500">내가 보유한 종목의 수량, 평균 매수가, 수익률을 계산하는 페이지로 이동할 수 있습니다.</p>
            <a href="/portfolio" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">포트폴리오 열기</a>
          </div>
        </div>
      </section>
    </main>
  );
}