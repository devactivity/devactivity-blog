---
title: "Iterator di Rust: Meminjam, bukan Mengonsumsi"
description: "Gunakan `iter()` untuk meminjam (borrow) koleksi Rust selama iterasi agar koleksi tersebut tetap dapat digunakan setelahnya. Sebaliknya, `into_iter()` mengonsumsi koleksi sehingga tidak dapat digunakan kembali."
pubDate: 2026-11-26
tags: ["rust", "iterators"]
category: "SNIPPET"
no: "25"
lang: "id"
draft: false
---

## TL;DR

> Gunakan `iter()` untuk meminjam (_borrow_) koleksi jika perulangan `for` harus tetap memungkinkan koleksi tersebut digunakan kembali, Sebaliknya `into_iter()` mengonsumsi koleksi dan memindahkan kepemilikannya (_take ownership_).

## Cara yang salah

Memanggil `into_iter()` pada sebuah `Vec` di dalam perulangan `for` memberikan kepemilikan (_ownership_) koleksi tersebut kepada perulangan:

```rust
fn main() {
    let names = vec![String::from("Ada"), String::from("Lin")];

    for name in names.into_iter() {
        println!("{name}");
    }

    println!("{} names", names.len());
}
```

Kode ini gagal di compile karena `names` telah dipindahkan (_moved_). Perulangan `for` merupakan sintaks untuk melakukan iterasi melalui sebuah `IntoIterator`. Pada `Vec`, `into_iter()` mengonsumsi vektor dan memindahkan elemen-elemennya keluar. Akibatnya, pemanggilan `.len()` di bagian akhir mencoba meminjam nilai yang sudah tidak ada lagi.

`into_iter()` berguna ketika kepemilikan perlu dipindahkan. Namun, menjadikannya pilihan bawaan dapat membuat akses selanjutnya menjadi tidak valid. Kegagalan ini justru membantu memperjelas keputusan terkait kepemilikan di dalam perulangan, alih-alih menyembunyikannya di balik pengindeksan. Compiler menolak penggunaan kedua tersebut daripada menduplikasi vektor secara diam-diam.

## Cara yang benar

Pinjam elemen-elemennya dengan `.iter()` jika perulangan hanya perlu memeriksanya:

```rust
fn main() {
    let names = vec![String::from("Ada"), String::from("Lin")];

    for name in names.iter() {
        println!("{name}");
    }

    println!("{} names", names.len());
}
```

Iterator sekarang menghasilkan nilai `&String`. `names` hanya dipinjam, sehingga tetap dapat digunakan setelah perulangan selesai dan `.len()` dapat dipanggil tanpa perlu mengkloning atau memindahkan _string_. Perbedaan utamanya terletak pada kepemilikan: `.iter()` meminta akses bersama (_shared access_), sedangkan `.into_iter()` meminta kepemilikan.

Kedua pilihan tersebut tidak mengubah cara perulangan mencetak setiap item. Perbedaannya terletak pada apa yang terjadi pada koleksi dan elemen-elemennya setelah iterasi selesai. Karena itu, pilih jenis akses paling terbatas yang dibutuhkan.

Inilah pilihan terkait kepemilikan (_ownership_) yang ditunjukkan pada [Bagian Iterator di cheats.rs](https://cheats.rs/#iterators): `into_iter()` mengonsumsi koleksi, `iter()` meminjamnya, dan `iter_mut()` meminjamnya secara _mutable_. Pilih berdasarkan apa yang perlu dilakukan perulangan terhadap setiap item. Untuk iterasi yang hanya menbaac data, _shared borrowing_ sudah cukup.

## Tanya Jawab

### Kapan sebaiknya menggunakan `into_iter()`?

Gunakan `into_iter()` ketika perulangan perlu mengambil alih _ownership_ setiap item dan koleksi asalnya tidak lagi diperlukan lagi. Memindahkan nilai ke koleksi lain merupakan salah satu penggunaan yang tepat.

### Apakah `iter()` mengkloning elemen?

Tidak. `iter()` menghasilkan _shared reference_, sehingga tidak mengkloning elemen maupun memindahkannya keluar dari koleksi. Gunakan `into_iter()` ketika kepemilikan perlu dipindahkan.

### Kapan saya sebaiknya menggunakan `iter_mut()`?

Gunakan `iter_mut()` ketika perulangan perlu memodifikasi elemen secara langsung. `Iterator` ini menghasilkan _mutable reference_ dan tetap memungkinkan koleksi asal digunakan setelahnya.
