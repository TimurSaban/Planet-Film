import { kacisMetni } from "../lib/html.js";

/** Giriş sayfası içeriği. */
export function girisIcerigi({ yonlendirme = null } = {}) {
  return `
      <section class="kimlik-karti">
        <h1>Giriş Yap</h1>
        <p class="kahraman-metin">Hesabınıza giriş yaparak puan verin, yorum yazın ve listelerinizi yönetin.</p>

        <form id="giris-formu" class="form" method="post" action="/api/giris">
          ${yonlendirme ? `<input type="hidden" name="yonlendirme" value="${kacisMetni(yonlendirme)}">` : ""}
          <div class="form-alani">
            <label for="kimlik">E-posta veya kullanıcı adı</label>
            <input id="kimlik" name="kimlik" type="text" autocomplete="username" maxlength="254" required>
            <p class="alan-hatasi" data-alan="kimlik"></p>
          </div>

          <div class="form-alani">
            <label for="sifre">Şifre</label>
            <input id="sifre" name="sifre" type="password" autocomplete="current-password" required>
            <p class="alan-hatasi" data-alan="sifre"></p>
          </div>

          <p class="form-hatasi" role="alert" hidden></p>

          <button class="dugme dugme-birincil" type="submit">Giriş Yap</button>
        </form>

        <p class="form-alt">Hesabınız yok mu? <a href="/kayit">Kayıt olun</a>.</p>
      </section>`;
}

/** Kayıt sayfası içeriği. */
export function kayitIcerigi() {
  return `
      <section class="kimlik-karti">
        <h1>Kayıt Ol</h1>
        <p class="kahraman-metin">Ücretsiz hesap oluşturun; filmleri puanlayın, yorum yazın ve listelerinizi tutun.</p>

        <form id="kayit-formu" class="form" method="post" action="/api/kayit">
          <div class="form-alani">
            <label for="kullaniciAdi">Kullanıcı adı</label>
            <input id="kullaniciAdi" name="kullaniciAdi" type="text" autocomplete="username"
                   minlength="3" maxlength="30" required>
            <p class="alan-hatasi" data-alan="kullaniciAdi"></p>
          </div>

          <div class="form-alani">
            <label for="email">E-posta</label>
            <input id="email" name="email" type="email" autocomplete="email" maxlength="254" required>
            <p class="alan-hatasi" data-alan="email"></p>
          </div>

          <div class="form-alani">
            <label for="sifre">Şifre</label>
            <input id="sifre" name="sifre" type="password" autocomplete="new-password"
                   minlength="8" maxlength="72" required>
            <p class="alan-hatasi" data-alan="sifre"></p>
          </div>

          <p class="form-hatasi" role="alert" hidden></p>

          <button class="dugme dugme-birincil" type="submit">Kayıt Ol</button>
        </form>

        <p class="form-alt">Zaten hesabınız var mı? <a href="/giris">Giriş yapın</a>.</p>
      </section>`;
}
