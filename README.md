# BingoBala

Dijital tombala (bingo) çekilişi, ödül PDF üretimi ve sesli okuma özelliklerini tek çatı altında sunan web uygulaması.

## Özellikler
- 1-90 arası sayıları manuel veya otomatik çeker, sonuçları canlı olarak gösterir.
- Cihazın TTS motorunu kullanarak numaraları sesli okur (birden çok dil desteği).
- Ödül kartlarını PDF formatında üretir ve cihazda saklar.
- PWA yetenekleri sayesinde çevrimdışı çalışma ve ana ekrana ekleme desteği sunar.

## Geliştirme
```
npm install
npm run dev
```

Statik çıktıyı yayınlamak için (ör. GitHub Pages) `dist` klasörünü barındırmanız yeterlidir.

## Google Play Hazırlığı

Aşağıdaki adımlar web uygulamasını TWA/Capacitor üzerinden Google Play Store’a taşırken gereklidir:

1. **PWA Gereksinimleri**
	- `manifest.webmanifest` ve `service-worker.js` dosyaları günceldir.
	- `assets/icon-192.png`, `assets/icon-512.png` ve `assets/icon-1024.png` dosyalarını marka rehberinize göre güncelleyebilirsiniz (gerekirse yeni PNG’ler üretin).
2. **Reklamlar ve Analitik**
	- Play sürümünde Google AdSense betiğini kaldırın ya da Google’ın mobil reklam SDK’larıyla değiştirin.
	- Veri Güvenliği formunda yalnızca kullandığınız SDK’ları beyan edin.
3. **Gizlilik Politikası**
	- `privacy-policy.html` dosyasını barındırın ve mağaza kaydında bu URL’yi paylaşın.
4. **Android Paketleme**
	- Capacitor/TWA ile paketleyin: `npx cap init`, ardından `npx cap add android`.
	- `android/app/src/main/AndroidManifest.xml` içinde internet izni (`android.permission.INTERNET`) bulunduğundan emin olun.
	- Uygulama kimliği olarak manifestteki `id` ile uyumlu bir paket adı seçin (ör. `com.bingobala.app`).
5. **Test**
	- Android cihazda çevrimdışı mod, sesli okuma ve PDF üretimini test edin.
	- Play Console gereksinimlerine uygun ekran görüntüleri hazırlayın.

Detaylı talimatlar için Google’ın [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/) veya [Capacitor](https://capacitorjs.com/docs/android) belgelerine göz atın.
