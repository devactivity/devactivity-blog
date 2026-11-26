---
title: "Foreign Types dan Traits di Rust: Aturan Orphan"
description: "Pelajari aturan orphan di Rust: implementasikan trait lokal untuk foreign type, lalu gunakan newtype ketika menerapkan foreign trait pada tipe lokal tanpa cara tertentu yang tidak semestinya."
pubDate: 2026-11-25
tags: ["rust", "foreign-types-and-traits"]
category: "SNIPPET"
no: "24"
lang: "id"
draft: false
---

## TL;DR

Aturan orphan Rust memungkinkan untuk mengimplementasikan trait lokal untuk _foreign type_. Jika _trait_ tersebut merupakan _foreign trait_, definisikan sebuah _wrapper_ lokal dan implementasikan _trait_ tersebut pada _wrapper_ itu, bukan tipe aslinya.

## Cara yang salah

Mulailah dengan kebutuhan yang umum: membuat `Vec<u8>` dapat dicetak menggunakan `{}` tanpa harus memformatnya secara manual. Implementasi yang tampak jelas adalah mencoba menambahkan perilaku `Display` pada tipe yang bukan milik _crate_:

```rust
impl std::fmt::Display for Vec<u8> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
```

Implementasi ini gagal dengan galat aturan orphan `E0117`. Baik `std::fmt::Display` maupun `Vec` merupakan _foreign type_ terhadap _crate_. Rust tidak mengizinkan satu _crate_ menambahkan perilaku pada _trait_ milik _crate_ lain untuk tipe yang juga dimiliki _crate_ lain, karena _crate_ yang dikembangkan secara independen dapat menghasilkan implementasi yang saling bertentangan.

Istilah `"foreign"` bukan berarti suatu tipe tidak dapat digunakan. Istilah ini menunjukkan siapa yang memiliki kendali atas implementasinya.

## Cara yang benar

Langkah paling sederhana yang diizinkan adalah menjadikan _trait_ tersebut sebagai _trait_ lokal. Dengan begitu, _foreign type_ dapat mengimplementasikan perilaku yang ingin didefinisikan:

```rust
trait Summary {
    fn summary(&self) -> &str;
}

impl Summary for String {
    fn summary(&self) -> &str {
        self.lines().next().unwrap_or("")
    }
}

fn main() {
    let text = "Rust\nNotes".to_owned();
    println!("{}", text.summary());
}
```

Dalam contoh ini, `Summary` merupakan _trait_ lokal, sehingga mengimplementasikannya untuk `String` diperbolehkan. Dengan menambahkan API yang menyediakan fungsionalitas tambahan pada `String`, bukan mengubah tipe `String` itu sendiri. _Crate_ lain dapat mengimplementasikan _trait_ yang berbeda untuk `String` tanpa menimbulkan konflik dengan implementasi ini.

Prinsip yang sama berlaku ketika trait yang ingin digunakan merupakan _foreign trait_. Alih-alih mengimplementasikan `Display` untuk `String`, buatlah _wrapper_ lokal dan implementasikan `Display` untuk _wrapper_ tersebut. _Wrapper_ inilah yang menjadi tipe lokal sehingga memenuhi aturan orphan.

Jadikan aturan ini sebagai panduan dalam merancang kode: tentukan apakah abstraksi perlu mendefinisikan perilakunya sendiri melalui _trait_ lokal, atau perlu mengintegrasikan ke _standard interface_ yang sudah ada melalui kombinasi _newtype_ lokal dan _foreign trait_.

## Tanya jawab

### Apa saja yang termasuk foreign?

Segala sesuatu yang didefinisikan di luar _crate_ saat ini dianggap _foreign_. `String`, `Vec`, dan `Display` merupkaan entitas _foreign_ bagi _crate_ aplikasi, sedangkan _trait_ atau _struct_ yang dideklarasikan di dalam _crate_ tersebut bersifat dianggap lokal.

### Bisakah foreign trait diimplementasikan untuk foreign type?

Tidak melalui `impl` biasa di dalam _crate_. Aturan orphan menolak implementasi ketika _trait_ dan tipe penerima sama-sama merupakan entitas _foreign_. Namun, implementasi generik terkadang tetap diperbolehkan jika menyertakan tipe lokal yang memenuhi persyaratan.

### Mengapa menggunakan newtype daripada memperluas `String` secara langsung?

_Newtype_ menyediakan tipe lokal yang dapat digunakan untuk mengimplementasikan _foreign trait_. Selain itu, _newtype_ memungkinkan untuk mengontrol proses konversi, sehingga dapat terhindar dari ketidak sengajaan dari penerapan perilaku tertentu untuk setiap nilai `String`.
