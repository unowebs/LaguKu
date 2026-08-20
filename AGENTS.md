<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## SISTEM NOT ANGKA - ATURAN DOMAIN

### DEFINISI NOT DAN TITIK

Dalam sistem not angka ini, titik (.) harus dianggap sebagai elemen/not yang berdiri sendiri, sama seperti angka not lainnya.

Fungsi musikal khusus titik:
- Titik berfungsi untuk memperpanjang durasi not yang berada tepat sebelumnya.
- Titik tetap merupakan elemen tersendiri di dalam urutan not.
- Titik dapat dipilih oleh user seperti elemen not lainnya.
- Titik memiliki posisi/urutan sendiri di dalam sistem not angka.
- Titik tidak boleh dianggap hanya sebagai karakter dekoratif atau atribut dari not sebelumnya.

Contoh: 3 . 4
Urutan elemen: [3] [.] [4]  BUKAN  [3.] [4]
Secara fungsi musikal, . memperpanjang durasi 3, tetapi secara struktur sistem, . tetap merupakan ELEMEN TERSENDIRI.

---

### HUBUNGAN TITIK DENGAN NOT SEBELUMNYA

Walaupun titik merupakan elemen tersendiri, titik memiliki hubungan dengan not tepat sebelumnya.

Contoh: 3 .
- Elemen pertama = 3
- Elemen kedua = .
- . memperpanjang durasi 3

Jika titik dipindahkan, hubungan durasinya ikut berubah sesuai posisi barunya.
Contoh: pada urutan [3] [.] [4], jika titik dipindahkan menjadi [3] [4] [.] maka titik memperpanjang durasi 4, bukan 3.

---

### HUBUNGAN DENGAN FITUR GARIS DI ATAS NOT

Karena titik merupakan not/elemen tersendiri, titik juga ikut dihitung ketika sistem menentukan apakah dua elemen bersebelahan.

Pada urutan [3] [.] [4], garis di atas hanya boleh diterapkan pada elemen yang benar-benar bersebelahan:
- VALID  : 3 + . (elemen 1 dan 2 bersebelahan)
- VALID  : . + 4 (elemen 2 dan 3 bersebelahan)
- TIDAK VALID: 3 + 4 (karena ada elemen . di antaranya)

Sistem tidak boleh melewati titik hanya karena titik secara musikal memperpanjang not sebelumnya.

---

### ATURAN UTAMA

Anggap setiap angka dan titik sebagai element/not individual dalam sequence.

Contoh: 3 . 4 . 5
Struktur internal: [3] [.] [4] [.] [5]  BUKAN  [3.] [4.] [5]

Fungsi musikal:
- 3 diperpanjang oleh .
- 4 diperpanjang oleh .
- 5 tidak diperpanjang

Sistem harus mempertahankan pemisahan antara STRUKTUR ELEMEN dan FUNGSI MUSIKAL.

Jangan mengubah aturan ini menjadi sistem di mana titik hanya disimpan sebagai property/atribut dari not sebelumnya.
Titik harus tetap menjadi ELEMEN TERSENDIRI yang memiliki posisi dan dapat dipilih,
tetapi memiliki hubungan durasi dengan elemen tepat sebelumnya.
