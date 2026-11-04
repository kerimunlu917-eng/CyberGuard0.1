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