import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { holdings, summary } = body;

        const prompt = `당신은 친절한 AI 투자 코치입니다. 아래 포트폴리오를 분석하고 초보 투자자가 이해하기 쉽게 3~5줄로 핵심 의견을 한국어로 작성해주세요.

포트폴리오 정보:
- 총 투자원금: ${summary.totalCostBasisKrw.toLocaleString()}원
- 총 평가금액: ${summary.totalMarketValueKrw.toLocaleString()}원
- 총 수익률: ${summary.totalReturnRate.toFixed(2)}%
- 보유 종목:
${holdings.map((h: any) => `  - ${h.name} (${h.symbol}): ${h.returnRate.toFixed(2)}% 수익률, 비중 ${((h.marketValueKrw / summary.totalMarketValueKrw) * 100).toFixed(1)}%`).join("\n")}

분석 시 다음을 포함해주세요:
1. 전체 포트폴리오 평가 (한 줄)
2. 잘된 점 또는 주의할 점
3. 초보 투자자를 위한 조언`;

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await res.json();
        console.log("Gemini 응답:", JSON.stringify(data));

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "분석 결과를 가져오지 못했습니다.";

        return NextResponse.json({ comment: text });
    } catch (error) {
        console.error("AI 코멘트 오류:", error);
        return NextResponse.json({ comment: "AI 분석 중 오류가 발생했습니다." }, { status: 500 });
    }
}