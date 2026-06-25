import fs from "fs";
import path from "path";

const OUTPUT_PATH = path.resolve("data/kr-stocks.json");

async function fetchStocks() {
    const res = await fetch(
        "https://api.stock.naver.com/stock/exchange/KOSPI/marketValue?page=1&pageSize=2000",
        {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
            },
        }
    );
    const data = await res.json();
    console.log(JSON.stringify(data).slice(0, 300));
}

fetchStocks().catch(console.error);