const fs = require("fs");
const { chromium } = require("playwright");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const termos = fs.readFileSync("termos.txt", "utf8")
    .split("\n").map(s => s.trim()).filter(Boolean);

  const hoje = new Date().toISOString().slice(0, 10);
  const saida = [];

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const termo of termos.slice(0, 60)) {
    await page.goto("https://www.bing.com", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="q"]', termo);
    await page.keyboard.press("Enter");
    await page.waitForLoadState("domcontentloaded");
    await sleep(3000);

    const results = await page.$$eval("li.b_algo h2 a", as =>
      as.slice(0, 3).map(a => ({ title: (a.textContent || "").trim(), url: a.href }))
    );

    saida.push({ termo, results });
    console.log("Buscou:", termo);

    await sleep(2500);
  }

  await browser.close();

  fs.mkdirSync("out", { recursive: true });
  fs.writeFileSync(`out/resultado-${hoje}.json`, JSON.stringify(saida, null, 2), "utf8");
  console.log("OK: out/resultado-" + hoje + ".json");
})();
