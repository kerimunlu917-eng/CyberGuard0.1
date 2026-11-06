# CyberGuard 3.1
Türkçe temel siber güvenlik paneli.

## Özellikler
- İstemci tarafı parola tahmini ve Have I Been Pwned Pwned Passwords k-anonimlik aralık sorgusu. Parolanın kendisi gönderilmez; SHA-1 önekinin ilk 5 karakteri gönderilir.
- URL sezgisel kontrolleri ve isteğe bağlı Google Safe Browsing v4 sorgusu.
- IPv4/CIDR hesaplama (/31 ve /32 ayrımı), özel/ayrılmış aralık işaretleme ve IPv6 biçim doğrulama.
- localStorage geçmişi, TXT raporu ve yazdırılabilir PDF.

## Yerel çalıştırma
Node.js 18+:
```sh
npm install
npm start
```
http://localhost:3000

## GitHub Pages + Safe Browsing API
GitHub Pages yalnızca statik dosya sunar; `server.js` gibi Node.js API sunucularını çalıştırmaz. Bu nedenle API, ayrı bir Node hosting hizmetinde çalışmalıdır.

1. Bu depodaki `render.yaml` ile Render'da yeni Blueprint deploy başlatın.
2. Render servisinin Environment bölümüne `GOOGLE_SAFE_BROWSING_API_KEY` değişkenini ekleyin. Değeri Google Cloud Console'dan alınan anahtardır. Anahtarı GitHub'a veya tarayıcı koduna koymayın.
3. Render servisinin URL'sini aldıktan sonra `api-config.js` içindeki boş değeri o URL ile değiştirin (ör. `https://cyberguard-api.onrender.com`).
4. Değişikliği `main` dalına gönderin. GitHub Pages arayüzü bu API'ye CORS üzerinden bağlanır.

Google Cloud Console'da Safe Browsing API'yi etkinleştirin ve API anahtarını yalnızca Render ortam değişkenine girin. API anahtarını HTTP referrer/IP kısıtlamaları ve kota ile koruyun.

## Gizlilik ve sınırlar
- Parola geçmişe kaydedilmez. Pwned Passwords kontrolü k-anonimlik yaklaşımı kullanır; internet bağlantısı gerekir.
- URL, Safe Browsing etkinleştirilirse Google'a gönderilir.
- Geçmiş tarayıcının localStorage alanında tutulur.
- Araç kesin güvenlik garantisi vermez; profesyonel denetimin yerine geçmez.

## Test
`npm test`
