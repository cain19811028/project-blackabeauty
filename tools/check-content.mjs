// Original copy and shop details must survive verbatim (plan §7, §9.1): node tools/check-content.mjs [page]
// Every string below is copied from the original site (identical to the live HiNet pages as of 2026-10-03).
// Layout may change; the characters may not. Exits 1 and lists every missing item.
import { readFileSync } from 'node:fs';

const page = process.argv[2] || 'index.html';
const html = readFileSync(page, 'utf8');

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
// Visible text with tags removed; whitespace dropped because line breaks in the source are layout, not copy.
const text = decode(html
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<[^>]+>/g, '')).replace(/\s+/g, '');
const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map((m) => decode(m[1]));
// Map URLs, readable: percent-decoded, plus the base64 place names Google packs into `pb=…!2z<base64>`.
const mapUrls = [...html.matchAll(/\b(?:src|href)="([^"]*google\.com\/maps[^"]*)"/g)].map((m) => {
  const url = decode(m[1]);
  let readable;
  try { readable = decodeURIComponent(url); } catch { readable = url; }
  const places = [...url.matchAll(/!2z([A-Za-z0-9_-]+)/g)].map((p) => Buffer.from(p[1], 'base64url').toString('utf8'));
  return [readable, ...places].join(' ');
});

const SCHOOLS = ('清華大學、台北大學、輔仁大學、中正大學、中山大學、中原大學、成功大學、東吳大學、高雄大學、台灣海大、元智大學、文化學院、'
  + '政治大學、台灣師大、高雄師大、新竹師大、崑山大學、輔英大學、虎尾學院、康寧學院、台北師大、台北商院、高雄應大、高雄科大、'
  + '長榮大學、嘉南大學、南華大學、真理大學、屏東師大、屏東商院、屏東科大、北台學院、大仁大學、高醫大學、聖約翰大學、美和學院、'
  + '中華大學、花蓮師大、東華大學、台中學院、環球學院、聯合大學、永達學院、立德大學、致遠學院、興國學院、德明學院、德霖學院、'
  + '東南大學、實踐大學、景文學院、藝術大學、中洲學院、空中大學、東方學院、亞東學院、雲林科大、大葉大學、台北科大、樹德科大、'
  + '南台大學、建國大學、醒吾大學、中台學院、中華醫院、南亞學院、南開學院、高苑大學、高雄海大、台灣體院、慈濟大學、澎湖海院、'
  + '餐旅學院、大漢學院、高鳳大學').split('、');

const checks = [
  // 聯絡我們 (contact.html, service.html)
  ['公司名稱', () => text.includes('黑美人服飾開發有限公司')],
  ['電話', () => text.includes('(07)3493832、3597082、3597036')],
  ['傳真', () => text.includes('(07)3104329、3426879')],
  ['行動', () => text.includes('0933-907-593')],
  ['地址', () => text.includes('高雄市三民區鼎貴路62巷14號')],
  ['信箱', () => text.includes('yes_blackabeauty_yes@yahoo.com.tw')],
  ['tel: 連結（四支）', () => ['tel:073493832', 'tel:073597082', 'tel:073597036', 'tel:0933907593'].every((t) => hrefs.includes(t))],
  ['mailto: 連結', () => hrefs.includes('mailto:yes_blackabeauty_yes@yahoo.com.tw')],
  ['官網連結', () => hrefs.includes('http://www.blackabeauty.com.tw')],
  ['FB 連結', () => hrefs.some((h) => h.includes('facebook.com/pages/') && h.endsWith('/559226934194966'))],
  ['奇摩拍賣連結', () => hrefs.includes('https://tw.bid.yahoo.com/tw/booth/Y3789989705')],
  ['Blogger 連結', () => hrefs.includes('http://blackabeauty999.blogspot.tw/')],
  ['地圖指向新址', () => mapUrls.length > 0 && mapUrls.every((u) => u.includes('鼎貴路62巷14號'))],
  ['沒有任何舊址（鼎信街）', () => !text.includes('鼎信街') && !mapUrls.some((u) => u.includes('鼎信街'))],
  // 關於我們 (about.html; the Big5 emphasis marks are restored as 「」, plan §7.2)
  ['關於：機關團體', () => text.includes('歡迎機關、團體「訂購、出租」')],
  ['關於：專營', () => text.includes('本公司專營國內外各大學之博士、碩士、學士服')],
  ['關於：個人訂製', () => text.includes('接受「個人訂製」國內外博士服、碩士服')],
  // 其他服務 (service.html)
  ['服務說明', () => text.includes('本公司承製國內各大學之說明：【附設洗衣、訂製、出租】')],
  ['八大承諾', () => ['直營工廠', '一貫作業', '專人設計', '經驗豐富', '物美價廉', '品質保證', '服務週到', '專程送達'].every((w) => text.includes(w))],
  ['承製院校引言', () => text.includes('曾承製全國各大學院校有：')],
  ...SCHOOLS.map((name) => [`院校：${name}`, () => text.includes(name)]),
  ['院校結語', () => text.includes('等75所大學正在增加中......')],
  ['規格：博士服', () => /1\.博士服含披、帽1套/.test(text)],
  ['規格：碩士服', () => /2\.碩士服含披、帽1套來電詢問提供出租/.test(text)],
  ['規格：學士服', () => /3\.學士服中西式1套/.test(text)],
  // 相關產品 (other.html; the 、 after 襯衫 replaces the original line break, plan §7.6)
  ['相關產品', () => text.includes('相關產品有運動服、團體服、學生制服、夾克、襯衫、合唱服、舞蹈服、帽子、休閒服、鳳仙裝、廣告背心、餐飲廚服、醫生袍、護士服、祭典禮服...等。歡迎來電詢問～！')],
];

if (SCHOOLS.length !== 75 || new Set(SCHOOLS).size !== 75) throw new Error('the reference school list itself must hold 75 unique names');

const failed = checks.filter(([, ok]) => !ok());
console.log(`${checks.length - failed.length}/${checks.length} checks pass for ${page}`);
failed.forEach(([name]) => console.log(`  MISSING  ${name}`));
process.exitCode = failed.length ? 1 : 0;
