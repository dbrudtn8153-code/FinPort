type QuoteResult = {
  symbol: string;
  name: string;
  price: number;
  oneYearReturn: number;
  dividendYield: number;
  expenseRatio: number;
  aum: string;
};

async function fetchYahooPrice(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
    {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`가격 조회 실패: ${symbol}`);
  }

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  const meta = result?.meta;

return {
  symbol,
  name:
    meta?.longName ||
    meta?.shortName ||
    meta?.symbol ||
    symbol,
  price: meta?.regularMarketPrice ?? 0,
};
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return Response.json({ results: [] });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  try {
    const results: QuoteResult[] = await Promise.all(
      symbols.map(async (symbol) => {
        const quote = await fetchYahooPrice(symbol);

        return {
          symbol: quote.symbol,
          name: quote.name,
          price: quote.price,
          oneYearReturn: 0,
          dividendYield: 0,
          expenseRatio: 0,
          aum: "-",
        };
      })
    );

    return Response.json({ results });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "데이터 가져오기 실패" },
      { status: 500 }
    );
  }
}