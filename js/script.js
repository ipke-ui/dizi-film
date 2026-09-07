    /* Supabase proje adresi ve tarayıcıda kullanılabilen public anahtar */
    const SUPABASE_URL = "https://gmnhuurnwfguqivoelri.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LY8rkVoKN6juJoUEZZxAjw__aY2L6g7";

    /* Supabase veritabanı bağlantısını oluşturur */
    const db = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    /* Kullanıcının seçtiği film veya dizinin adını saklar */
    let seciliFilm = "";

    /* Ek bilgiler: oyuncular, karakterler, sezonlar ve fragmanlar */
    const yapimBilgileri = {
      "Yalan Dünya": {tur:"Komedi",yil:2012,oyuncular:["Gülse Birsel – Deniz","Beyazıt Öztürk – Rıza","Nihal Yalçın – Açılay","Derya Karadaş – Zerrin","Hasibe Eren – Gülistan"],karakterler:["Deniz","Rıza","Açılay","Zerrin","Gülistan","Emir"],sezonlar:["1. Sezon: Tanışma, Yeni hayat, Cihangir macerası","2. Sezon: Yeni başlangıç, Karışan işler, Büyük sürpriz"],fragman:"https://www.youtube.com/results?search_query=Yalan+Dünya+fragman"},
      "Friends": {tur:"Komedi",yil:1994,oyuncular:["Jennifer Aniston – Rachel","Courteney Cox – Monica","Lisa Kudrow – Phoebe","Matt LeBlanc – Joey","Matthew Perry – Chandler","David Schwimmer – Ross"],karakterler:["Rachel","Monica","Phoebe","Joey","Chandler","Ross"],sezonlar:["1. Sezon: The Pilot, The Sonogram, The Thumb","2. Sezon: Ross's New Girlfriend, The Breast Milk"],fragman:"https://www.youtube.com/results?search_query=Friends+official+trailer"},
      "Black Mirror": {tur:"Bilim Kurgu",yil:2011,oyuncular:["Her bölümde farklı oyuncu kadrosu"],karakterler:["Lacie","Yorkie","Robert Daly","Nish"],sezonlar:["1. Sezon: The National Anthem, Fifteen Million Merits","2. Sezon: Be Right Back, White Bear"],fragman:"https://www.youtube.com/results?search_query=Black+Mirror+official+trailer"},
      "Interstellar": {tur:"Bilim Kurgu",yil:2014,oyuncular:["Matthew McConaughey – Cooper","Anne Hathaway – Brand","Jessica Chastain – Murph"],karakterler:["Cooper","Brand","Murph"],sezonlar:["Film süresi: 169 dakika"],fragman:"https://www.youtube.com/results?search_query=Interstellar+official+trailer"},
      "La La Land": {tur:"Romantik",yil:2016,oyuncular:["Emma Stone – Mia","Ryan Gosling – Sebastian"],karakterler:["Mia","Sebastian"],sezonlar:["Film süresi: 128 dakika"],fragman:"https://www.youtube.com/results?search_query=La+La+Land+official+trailer"},
      "The Devil Wears Prada": {tur:"Komedi",yil:2006,oyuncular:["Meryl Streep – Miranda","Anne Hathaway – Andy","Emily Blunt – Emily"],karakterler:["Miranda","Andy","Emily"],sezonlar:["Film süresi: 109 dakika"],fragman:"https://www.youtube.com/results?search_query=The+Devil+Wears+Prada+official+trailer"}
    };
    const veriOku = (anahtar, varsayilan = []) => { try { return JSON.parse(localStorage.getItem(anahtar)) ?? varsayilan; } catch { return varsayilan; } };
    const veriYaz = (anahtar, deger) => localStorage.setItem(anahtar, JSON.stringify(deger));

    /* Kalbin tıklanan noktasını 0.25 aralıklı puana çevirir */
    function kalpPuaniSec(event) {
      const alan = document.getElementById("heartPicker");
      const kutu = alan.getBoundingClientRect();
      const puan = Math.min(5, Math.max(0.25, Math.ceil(((event.clientX - kutu.left) / kutu.width) * 20) / 4));
      document.getElementById("ratingInput").value = puan;
      document.getElementById("heartPickerFill").style.width = (puan / 5) * 100 + "%";
      document.getElementById("ratingValue").textContent = puan.toFixed(2) + " / 5";
    }

    /* Film kartına basıldığında detayları ve ortak yorumları gösterir */
    async function detayAc(baslik, aciklama, oneriler) {
      seciliFilm = baslik;

      document.getElementById("detailTitle").textContent = baslik;
      document.getElementById("detailText").textContent = aciklama;

      /* Benzer yapımları ayrı etiketler hâlinde gösterir */
      document.getElementById("suggestionList").innerHTML =
        oneriler.map(film => `<span>${film}</span>`).join("");

      /* Eski detay alanına yeni özellikleri ekler */
      detayEkleriniGoster(baslik);
      gecmiseEkle(baslik);
      document.getElementById("usernameInput").value = localStorage.getItem("profileName") || "";

      document.getElementById("commentMessage").textContent = "";
      document.getElementById("commentInput").value = "";
      document.getElementById("oneriler").classList.add("active");

      /* Seçilen filme ait yorumları veritabanından getirir */
      await yorumlariGetir();

      document.getElementById("oneriler").scrollIntoView({
        behavior: "smooth"
      });
    }

    /* Kullanıcının yazdığı yorumu Supabase'e kaydeder */
    async function yorumKaydet() {
      const kullaniciAdi = document
        .getElementById("usernameInput")
        .value
        .trim();

      const puan = Number(
        document.getElementById("ratingInput").value
      );

      const yorum = document
        .getElementById("commentInput")
        .value
        .trim();

      const mesaj = document.getElementById("commentMessage");
      const buton = document.getElementById("commentButton");

      /* Kullanıcı girdilerini kontrol eder */
      if (!seciliFilm) {
        mesaj.textContent = "Önce bir film veya dizi seçmelisin.";
        return;
      }

      if (kullaniciAdi.length < 2 || kullaniciAdi.length > 30) {
        mesaj.textContent = "Ad veya rumuz 2–30 karakter arasında olmalı.";
        return;
      }

      if (puan < 0.25 || puan > 5 || !Number.isInteger(puan * 4)) {
        mesaj.textContent = "Kalplerden 0.25 ile 5 arasında bir puan seç.";
        return;
      }

      if (yorum.length < 2 || yorum.length > 500) {
        mesaj.textContent = "Yorum 2–500 karakter arasında olmalı.";
        return;
      }

      /* Gönderim sırasında butona tekrar basılmasını engeller */
      buton.disabled = true;
      buton.textContent = "Gönderiliyor...";

      /* Yorumu comments tablosuna ekler */
      const kaydedilecekYorum = document.getElementById("spoilerInput").checked ? "[SPOILER] " + yorum : yorum;
      const { error } = await db.from("comments").insert({
        movie_name: seciliFilm,
        username: kullaniciAdi,
        comment_text: kaydedilecekYorum,
        rating: puan
      });

      if (error) {
        console.error(error);
        mesaj.textContent = "Yorum gönderilemedi. Supabase ayarlarını kontrol et.";
        buton.disabled = false;
        buton.textContent = "Yorumu gönder";
        return;
      }

      /* Başarılı gönderimden sonra formu temizler */
      mesaj.textContent = "Yorumun başarıyla gönderildi.";
      document.getElementById("commentInput").value = "";
      document.getElementById("ratingInput").value = "";
      document.getElementById("heartPickerFill").style.width = "0";
      document.getElementById("ratingValue").textContent = "Puan seçmek için kalplere tıkla";

      /* Yeni yorumu göstermek için listeyi tekrar yükler */
      await yorumlariGetir();
      await kartOrtalamalariniGetir();

      buton.disabled = false;
      buton.textContent = "Yorumu gönder";
    }

    /* Seçilen filme ait herkesin yorumlarını getirir */
    async function yorumlariGetir() {
      const yorumListesi = document.getElementById("commentsList");
      yorumListesi.textContent = "Yorumlar yükleniyor...";

      const { data, error } = await db
        .from("comments")
        .select("id, username, comment_text, rating, created_at")
        .eq("movie_name", seciliFilm)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        yorumListesi.textContent = "Yorumlar yüklenemedi.";
        return;
      }

      if (!data || data.length === 0) {
        yorumListesi.textContent = "Henüz yorum yok. İlk yorumu sen yaz!";
        return;
      }

      yorumListesi.innerHTML = "";

      /* Her yorum için güvenli HTML elemanları oluşturur */
      data.forEach(yorum => {
        const yorumKutusu = document.createElement("article");
        yorumKutusu.className = "public-comment";

        const yazar = document.createElement("div");
        yazar.className = "comment-author";
        yazar.textContent = yorum.username;

        const yildiz = document.createElement("div");
        yildiz.className = "comment-rating";
        const yorumPuani = Number(yorum.rating);
        yildiz.innerHTML = `<span class="heart-visual"><span>♥♥♥♥♥</span><span class="heart-fill" style="width:${(yorumPuani / 5) * 100}%">♥♥♥♥♥</span></span><span>${yorumPuani.toFixed(2)} / 5</span>`;

        const metin = document.createElement("p");
        metin.className = "comment-text";
        const spoiler = yorum.comment_text.startsWith("[SPOILER] ");
        metin.textContent = spoiler ? "⚠ Spoiler — görmek için tıkla: " + yorum.comment_text.slice(10) : yorum.comment_text;
        if (spoiler) { metin.classList.add("spoiler-text"); metin.onclick = () => metin.classList.remove("spoiler-text"); }

        const begen = document.createElement("button");
        const begeniler = veriOku("commentLikes", {});
        begen.className = "like-button" + (begeniler[yorum.id] ? " active" : "");
        begen.textContent = begeniler[yorum.id] ? "♥ Beğendin" : "♥ Beğen";
        begen.onclick = () => yorumBegen(yorum.id, begen);

        const tarih = document.createElement("div");
        tarih.className = "comment-date";
        tarih.textContent = new Date(yorum.created_at).toLocaleString("tr-TR");

        yorumKutusu.appendChild(yazar);
        yorumKutusu.appendChild(yildiz);
        yorumKutusu.appendChild(metin);
        yorumKutusu.appendChild(tarih);
        yorumKutusu.appendChild(begen);
        yorumListesi.appendChild(yorumKutusu);
      });
    }

    /* Oyuncu, sezon, fragman, karakter ve liste düğmelerini oluşturur */
    function detayEkleriniGoster(baslik) {
      const bilgi = yapimBilgileri[baslik];
      if (!bilgi) return;
      const listede = anahtar => veriOku(anahtar).includes(baslik);
      document.getElementById("extraDetail").innerHTML = `
        <div class="extra-detail"><div class="suggestions"><span>${bilgi.tur}</span><span>${bilgi.yil}</span></div>
          <button class="small-button ${listede("watchlist") ? "active" : ""}" onclick="listeDegistir('watchlist')">+ İzleyeceğim</button>
          <button class="small-button ${listede("watched") ? "active" : ""}" onclick="listeDegistir('watched')">✓ İzledim</button>
          <button class="small-button ${listede("favorites") ? "active" : ""}" onclick="listeDegistir('favorites')">♥ Favori</button>
          <a class="trailer-link" href="${bilgi.fragman}" target="_blank" rel="noopener">▶ Fragmanı bul</a>
        </div>
        <div class="extra-detail"><h3>Oyuncular ve karakterler</h3><div class="character-grid">${bilgi.oyuncular.map(x => `<div class="character-card">${x}</div>`).join("")}</div></div>
        <div class="extra-detail"><h3>Sezon ve bölüm listesi</h3>${bilgi.sezonlar.map(x => `<div class="episode-row">${x}</div>`).join("")}</div>
        <div class="extra-detail"><h3>Karakterler</h3><div class="character-grid">${bilgi.karakterler.map(k => `<div class="character-card"><b>${k}</b><br><button class="small-button" onclick="karakterOyVer('${k}')">♥ Oy ver</button> <button class="small-button" onclick="karakterYorumla('${k}')">Yorumla</button></div>`).join("")}</div></div>`;
    }

    function listeDegistir(anahtar) {
      let liste = veriOku(anahtar);
      liste = liste.includes(seciliFilm) ? liste.filter(x => x !== seciliFilm) : [seciliFilm, ...liste];
      veriYaz(anahtar, liste); listeleriGoster(); detayEkleriniGoster(seciliFilm); kisiselOnerileriGoster();
    }
    function listeHTML(anahtar) { const l = veriOku(anahtar); return l.length ? l.map(ad => `<button class="mini-item" onclick="karttanDetayAc('${ad}')">${ad}</button>`).join("") : '<p class="detail-text">Liste henüz boş.</p>'; }
    function listeleriGoster() { document.getElementById("watchlist").innerHTML = listeHTML("watchlist"); document.getElementById("watchedList").innerHTML = listeHTML("watched"); document.getElementById("favoriteList").innerHTML = listeHTML("favorites"); document.getElementById("historyList").innerHTML = listeHTML("history"); }
    function karttanDetayAc(ad) { const kart = [...document.querySelectorAll(".movie-card")].find(k => k.querySelector("h3").textContent.trim() === ad); if (kart) kart.click(); }
    function gecmiseEkle(ad) { let g = veriOku("history").filter(x => x !== ad); g.unshift(ad); veriYaz("history", g.slice(0, 10)); listeleriGoster(); }
    function profilKaydet() { const ad = document.getElementById("profileName").value.trim(); document.getElementById("profileMessage").textContent = ad.length >= 2 ? "Profilin kaydedildi." : "En az 2 karakter yaz."; if (ad.length >= 2) localStorage.setItem("profileName", ad); }
    function yorumBegen(id, buton) { const b = veriOku("commentLikes", {}); b[id] = !b[id]; veriYaz("commentLikes", b); buton.classList.toggle("active", b[id]); buton.textContent = b[id] ? "♥ Beğendin" : "♥ Beğen"; }
    function karakterOyVer(k) { const o = veriOku("characterVotes", {}); o[k] = (o[k] || 0) + 1; veriYaz("characterVotes", o); karakterSiralamasi(); alert(k + " karakterine oy verdin!"); }
    function karakterYorumla(k) { const m = prompt(k + " hakkında yorumun:"); if (!m || !m.trim()) return; const y = veriOku("characterComments"); y.unshift({karakter:k, yorum:m.trim()}); veriYaz("characterComments", y); alert("Karakter yorumun bu tarayıcıya kaydedildi."); }
    function karakterSiralamasi() { const o = veriOku("characterVotes", {}); const tum = [...new Set(Object.values(yapimBilgileri).flatMap(x => x.karakterler))]; document.getElementById("characterRanking").innerHTML = tum.map(k => [k, o[k] || 0]).sort((a,b) => b[1]-a[1]).slice(0,10).map((x,i) => `<div class="mini-item">${i+1}. ${x[0]} — ♥ ${x[1]} oy</div>`).join(""); }
    function kartlariFiltrele() { const q = document.getElementById("searchInput").value.toLocaleLowerCase("tr"); const tur = document.getElementById("genreFilter").value; document.querySelectorAll(".movie-card").forEach(k => { const ad = k.querySelector("h3").textContent.trim(); const b = yapimBilgileri[ad]; const metin = (ad + " " + (b?.oyuncular || []).join(" ") + " " + (b?.karakterler || []).join(" ")).toLocaleLowerCase("tr"); k.style.display = metin.includes(q) && (!tur || b?.tur === tur) ? "" : "none"; }); }

    async function kartOrtalamalariniGetir() { const {data,error} = await db.from("comments").select("movie_name,rating"); if (error) return; const g = {}; (data || []).forEach(x => { g[x.movie_name] ||= {t:0,a:0}; g[x.movie_name].t += Number(x.rating); g[x.movie_name].a++; }); document.querySelectorAll(".movie-card").forEach(k => { const ad = k.querySelector("h3").textContent.trim(), alan = document.createElement("div"), eski = k.querySelector(".movie-average"); if (eski) eski.remove(); alan.className = "movie-average"; alan.textContent = g[ad] ? `♥ ${(g[ad].t/g[ad].a).toFixed(2)} / 5 · ${g[ad].a} yorum` : "♡ Henüz puan yok"; k.querySelector(".movie-info").appendChild(alan); }); }
    function kisiselOnerileriGoster() { const secilen = [...veriOku("favorites"), ...veriOku("watched")], turler = {}; secilen.forEach(ad => { const t = yapimBilgileri[ad]?.tur; if(t) turler[t] = (turler[t] || 0) + 1; }); const oner = Object.keys(yapimBilgileri).filter(ad => !veriOku("watched").includes(ad)).sort((a,b) => (turler[yapimBilgileri[b].tur]||0)-(turler[yapimBilgileri[a].tur]||0)).slice(0,3); document.getElementById("personalSuggestions").innerHTML = oner.map(x => `<span onclick="karttanDetayAc('${x}')">${x}</span>`).join(""); }

    const testSorulari = [{s:"Bir sorun çıkınca ne yaparsın?",c:["Espri yaparım","Kontrolü alırım","Duygusal davranırım","Sakin düşünürüm"]},{s:"Tarzın nasıl?",c:["Renkli","Klasik","Rahat","Modern"]},{s:"Arkadaş grubundaki rolün?",c:["Eğlendiren","Yöneten","Dert dinleyen","Mantıklı olan"]}]; let soruNo=0,testPuan=[0,0,0,0];
    function testiGoster(){ if(soruNo>=testSorulari.length){const i=testPuan.indexOf(Math.max(...testPuan));document.getElementById("quizArea").innerHTML=`<h3>Sen ${["Zerrin","Gülistan","Açılay","Deniz"][i]} karakterine benziyorsun! 💗</h3><button class="small-button" onclick="testiSifirla()">Tekrar çöz</button>`;return;}const s=testSorulari[soruNo];document.getElementById("quizArea").innerHTML=`<h3>${soruNo+1}. ${s.s}</h3><div class="quiz-options">${s.c.map((x,i)=>`<button class="small-button" onclick="testCevap(${i})">${x}</button>`).join("")}</div>`;}
    function testCevap(i){testPuan[i]++;soruNo++;testiGoster();} function testiSifirla(){soruNo=0;testPuan=[0,0,0,0];testiGoster();}

    /* Rastgele bir film veya dizi seçer */
    function rastgeleFilm() {
      const kartlar = document.querySelectorAll(".movie-card");
      const rastgele = Math.floor(Math.random() * kartlar.length);
      kartlar[rastgele].click();
    }

    /* Sayfa ilk açıldığında kişisel bölümleri doldurur */
    document.getElementById("profileName").value = localStorage.getItem("profileName") || "";
    listeleriGoster(); karakterSiralamasi(); testiGoster(); kisiselOnerileriGoster(); kartOrtalamalariniGetir();
