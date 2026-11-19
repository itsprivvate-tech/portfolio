// Vercel serverless function: fetches live NSE prices from Yahoo Finance on every call.
const SYMBOLS = ["TMPV.NS", "TMCV.NS", "TATAELXSI.NS", "SBIN.NS", "M&M.NS", "TITAN.NS"];

async function quote(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`${sym}: HTTP ${r.status}`);
  const m = (await r.json()).chart.result[0].meta;
  return {
    price: m.regularMarketPrice,
    prevClose: m.chartPreviousClose ?? m.previousClose,
    time: m.regularMarketTime * 1000,
  };
}

export default async function handler(req, res) {
  const out = {};
  await Promise.all(SYMBOLS.map(async (s) => {
    try { out[s] = await quote(s); } catch (e) { out[s] = { error: e.message }; }
  }));
  res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=40");
  res.status(200).json({ quotes: out, fetchedAt: Date.now() });
}
