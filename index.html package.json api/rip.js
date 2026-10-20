const cheerio = require('cheerio');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ ok: false, err: 'url required' });

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36',
        'Referer': 'https://www.google.com/'
      },
      redirect: 'follow'
    });
    const html = await r.text();
    const $ = cheerio.load(html);

    const kill = [
      '[class*=paywall]','[id*=paywall]','[class*=gate]','[class*=subscribe]',
      '[class*=premium]','[class*=regwall]','[class*=upsell]','[class*=modal]',
      '[class*=overlay]','[id*=gate]','[id*=premium]','[class*=locked]'
    ];
    let removed = 0;
    kill.forEach(s => { removed += $(s).length; $(s).remove(); });

    $('script[src],link[href],img[src],audio[src],video[src],source[src]').each((i, el) => {
      ['src','href'].forEach(a => {
        const v = $(el).attr(a);
        if (v && !/^(https?:|data:|\/\/)/.test(v)) {
          try { $(el).attr(a, new URL(v, url).href); } catch {}
        }
      });
    });

    res.json({ ok: true, base: url, removed, html: $.html() });
  } catch (e) {
    res.status(500).json({ ok: false, err: e.message });
  }
};
