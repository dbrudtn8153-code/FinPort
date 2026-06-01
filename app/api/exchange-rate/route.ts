export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("환율 데이터 요청 실패");
    }

    const json = await res.json();
    const rate = json?.rates?.KRW;

    if (!rate) {
      throw new Error("KRW 환율 없음");
    }

    return Response.json({ usdToKrw: rate });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "환율 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}