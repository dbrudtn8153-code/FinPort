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

export default function Home() {
  const [left, setLeft] = useState("VOO");
  const [right, setRight] = useState("QQQ");
  const [data, setData] = useState<EtfItem[] | null>(null);
  const [message, setMessage] = useState("");
  const [activeSymbols, setActiveSymbols] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

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
            <a href="/" className="hover:text-blue-600">
              ETF 비교
            </a>
            <a href="/dividend" className="hover:text-blue-600">
              배당 계산기
            </a>
            <a href="/portfolio" className="hover:text-blue-600">
              포트폴리오
            </a>
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
              ETF 비교부터 배당 계산까지,
              <br />
              투자에 필요한 정보를 한 번에
            </h2>

            <p className="mt-4 text-base text-blue-100 md:text-lg">
              수익률, 배당률, 운용보수, 순자산 규모를 보기 쉽게 비교해보세요.
            </p>

            <div className="mt-8 rounded-2xl bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input
                  value={left}
                  onChange={(e) => setLeft(e.target.value)}
                  placeholder="예: VOO"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                />

                <div className="text-center text-sm font-bold text-slate-500 md:px-2">
                  VS
                </div>

                <input
                  value={right}
                  onChange={(e) => setRight(e.target.value)}
                  placeholder="예: QQQ"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                />

                <button
                  onClick={compare}
                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  비교하기
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/dividend"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  배당 계산기로 이동
                </a>
                <a
                  href="/portfolio"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  포트폴리오로 이동
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">인기 비교</h3>
          <p className="text-sm text-slate-500">자주 비교하는 ETF 조합</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setQuickCompare("VOO", "QQQ")}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-lg font-bold">VOO vs QQQ</div>
            <div className="mt-1 text-sm text-slate-500">대표 성장 ETF 비교</div>
          </button>

          <button
            onClick={() => setQuickCompare("SCHD", "JEPI")}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-lg font-bold">SCHD vs JEPI</div>
            <div className="mt-1 text-sm text-slate-500">배당 ETF 비교</div>
          </button>

          <button
            onClick={() => setQuickCompare("VOO", "SCHD")}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-lg font-bold">VOO vs SCHD</div>
            <div className="mt-1 text-sm text-slate-500">성장 vs 배당 비교</div>
          </button>
        </div>
      </section>

      {message && (
        <section className="mx-auto max-w-6xl px-6 pt-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            {message}
          </div>
        </section>
      )}

      {data && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold">비교 결과</h3>
              <p className="mt-1 text-slate-500">
                {data[0]?.symbol} 와 {data[1]?.symbol ?? "ETF"} 비교
              </p>
            </div>

            <div className="text-sm text-slate-500">
              마지막 업데이트: {lastUpdated || "-"}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {data.map((etf) => (
              <div
                key={etf.symbol}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-600">
                      {etf.symbol}
                    </div>
                    <h4 className="mt-1 text-2xl font-bold">{etf.name}</h4>
                  </div>

                  <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    ETF
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">현재가</div>
                    <div className="mt-1 text-2xl font-bold">${etf.price}</div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">1년 수익률</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-600">
                      {etf.oneYearReturn}%
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">배당률</div>
                    <div className="mt-1 text-xl font-semibold">
                      {etf.dividendYield}%
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm text-slate-500">운용보수</div>
                    <div className="mt-1 text-xl font-semibold">
                      {etf.expenseRatio}%
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">순자산 규모</div>
                  <div className="mt-1 text-xl font-semibold">{etf.aum}</div>
                </div>
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
            <p className="mt-2 text-slate-500">
              성장형 ETF와 배당형 ETF를 쉽고 빠르게 비교할 수 있습니다.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">기능 2</div>
            <h4 className="mt-2 text-xl font-bold">배당 계산기</h4>
            <p className="mt-2 text-slate-500">
              투자금 기준 예상 연 배당과 월 배당을 따로 계산하는 페이지로 이동할 수 있습니다.
            </p>
            <a
              href="/dividend"
              className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              배당 계산기 열기
            </a>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-blue-600">기능 3</div>
            <h4 className="mt-2 text-xl font-bold">포트폴리오</h4>
            <p className="mt-2 text-slate-500">
              내가 보유한 종목의 수량, 평균 매수가, 수익률을 계산하는 페이지로 이동할 수 있습니다.
            </p>
            <a
              href="/portfolio"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              포트폴리오 열기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}