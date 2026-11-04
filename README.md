# CyberGuard 3.0
Türkçe temel siber güvenlik paneli.

## Özellikler
- İstemci tarafı parola tahmini ve Have I Been Pwned Pwned Passwords k-anonimlik aralık sorgusu. Parolanın kendisi gönderilmez; SHA-1 önekinin ilk 5 karakteri gönderilir.
- URL sezgisel kontrolleri ve isteğe bağlı Google Safe Browsing v4 sorgusu.
- IPv4/CIDR hesaplama (/31 ve /32 ayrımı), özel/ayrılmış aralık işaretleme ve IPv6 biçim doğrulama.
- localStorage geçmişi, TXT raporu ve yazdırılabilir PDF.
- Ayrı HTML/CSS/JS kaynakları ve temel testler.

## Çalıştırma
Node.js 18+:
```sh
npm install
npm start
```
http://localhost:3000

## Safe Browsing API (isteğe bağlı)
Google Cloud Console'da Safe Browsing API'yi etkinleştirip anahtar alın. Anahtarı frontend'e koymayın.
```sh
export GOOGLE_SAFE_BROWSING_API_KEY="YOUR_KEY"
npm start
```
Windows PowerShell: `$env:GOOGLE_SAFE_BROWSING_API_KEY="YOUR_KEY"`
Anahtar yoksa yalnızca yerel URL heuristikleri çalışır. Üretimde rate limit, HTTPS, API kota/kısıtlamaları ve gizlilik bildirimi ekleyin.

## Gizlilik ve sınırlar
- Parola geçmişe kaydedilmez. Pwned Passwords kontrolü k-anonimlik yaklaşımı kullanır; internet bağlantısı gerekir.
- URL, Safe Browsing etkinleştirilirse Google'a gönderilir.
- Geçmiş tarayıcının localStorage alanında tutulur.
- Araç kesin güvenlik garantisi vermez; profesyonel denetimin yerine geçmez.

## Test
`npm test`

## Vercel backend for GitHub Pages
GitHub Pages is static hosting, so the Safe Browsing API key must not be placed in browser JavaScript. This repository includes a Vercel serverless endpoint at `/api/url-check`.

1. Import this repository into Vercel and deploy it (the root directory is the repository root).
2. In Vercel Project Settings -> Environment Variables, add `GOOGLE_SAFE_BROWSING_API_KEY` for Production (and Preview if needed). Never commit the key.
3. Copy the production deployment origin (for example `https://your-project.vercel.app`) into `config.js` as `window.CYBERGUARD_API_BASE`.
4. Redeploy the Vercel project and wait for GitHub Pages to publish the updated `config.js`.
5. Test a normal URL and Google's documented test URL. A successful empty match response means no listed threat was found; it is not a guarantee of safety.

The API endpoint only accepts POST requests from the project's GitHub Pages origin and forwards URL lookups to Google Safe Browsing v4. Google documents this API for non-commercial use; commercial URL protection should use Web Risk instead.
