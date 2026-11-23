---
title: "Rust Static Promotion: Bagaimana Temporary Reference Bisa Memiliki Lifetime 'static"
description: "Lihat bagaimana static promotion rvalue di Rust mengubah `&42` menjadi `&'static i32`, mengapa peminjaman variabel lokal gagal, dan pola mana yang sebaiknya dipilih untuk menghasilkan kode yang aman dan mudah dibaca."
pubDate: 2026-11-21
tags: ["rust", "language-sugar"]
category: "SNIPPET"
no: "20"
lang: "id"
draft: false
---

## TL;DR

Rust melakukan promosi terhadap _constant rvalue_ yang memenuhi syarat, seperti `&42`, sehingga menghasilkan _reference_ `'static`. Namun, Rust tidak dapat memperpanjang _lifetime_ variabel lokal. Karena itu, mengembalikan `&n` akan menyebabkan error. Sebagai gantinya, kembalikan literal secara langsung atau pastikan nilainya tetap valid selama diperlukan oleh pemanggil.

## Cara yang salah

```rust
fn static_number() -> &'static i32 {
    let n = 42;
    &n
}
```

Sekilas, kode ini tampak setara. Namun, `n` merupakan binding lokal. Mengembalikan `&n` akan memungkinkan pemanggil mengakses nilai tersebut setelah _lifetime_ penyimpanan lokal fungsi berakhir. Karena itu, Rust menolak peminjaman (_borrow_) dengan error `"borrowed value does not live long enough"`. _Lifetime_ dalam signature fungsi merupakan jaminan kepada compiler, bukan instruksi untuk mempertahankan variabel lokal agar tetap tersedia.

Aturan yang sama juga berlaku ketika suatu nilai hanya dipinjam secara lokal:

```rust
let n = 42;
let x = &n;
```

Dalam contoh ini, `x` valid selama `n` tetap tersedia dalam _scope_ yang menaunginya, tetapi `x` bukan _reference_ `'static`. Bentuk singkat `&n` merupakan _syntactic sugar_ untuk meminjam sebuah _place expression_, bukan operasi yang menciptakan salinan nilai dengan _lifetime_ selamanya.

## Cara yang benar

```rust
fn static_number() -> &'static i32 {
    &42
}
```

Kode ini bisa di compile karena `42` merupakan _contant rvalue_ yang memenuhi syarat untuk dipromosikan. Melalui _static promotion rvalue_, Rust memberikan penyimpanan statis pada literal tersebut. Dengan demikian,`&42` memiliki tipe `&'static i32` dan tetap valid bahkan setelah fungsi dieksekusi. Compiler melakukan promosi ini secara otomatis, tidak memerlukan item `static` eksplisit ataupun _unsafe code_.

Perbedaan utamanya terletak pada apakah kita membuat _reference_ ke variabel lokal yang sudah ada atau merujuk langsung ke _constant_ yang dapat dipromosikan. Untuk kasus kedua, gunakan literal secara langsung. Jika nilanya bersifat dinamis, simpan nilai tersebut dalam variabel yang dimiliki oleh pemanggil, lalu buat _reference_ ke variabel tersebut, atau kembalikan nilai dalam bentuk _owned value_. Dengan begitu, hubungan _lifetime_ mnejadi jelas tanpa harus bergantung pada promosi tersembunyi yang hanya berlaku untuk jenis ekspresi tertentu.

Promosi sengaja diterapkan secara konservatif. Rust tidak mempromosikan sembarang hasil evaluasi runtime, variabel lokal, ataupun nilai yang tipenya tidak memenuhi aturan promosi. Pembatasan ini memastikan bahwa jaminan `'static` tetap bermakna, nilai yang dirujuk memang harus valid selama _lifetime_ program, bukan sekadar mudah digunakan dalam sebuah _snippet code_.

## Tanya jawab

### Apakah setiap `&42` menjadi `'static`?

Hanya _constant rvalue_ yang memenuhi syarat yang dapat dipromosikan. _Reference_ ke variabel lokal tetap terikat pada _lifetime_ variabel tersebut, sedangkan ekspresi literal seperti `&42` dapat mengalami _static promotion_.

### Mengapa tidak menggunakan `Box::leak` atau `static` eksplisit?

Kedua mekanisme tersebut memiliki kegunaan yang berbeda, `Box::leak` dengan sengaja mengorbankan pembersihan, sedangkan `static` bernama memerlukan nilai tetap. Promosi literal langsung lebih sederhana jika ekspresinya memenuhi syarat.

### Apakah ini hanya berlaku untuk bilangan bulat?

Tidak. Promosi dapat berlaku untuk ekspresi konstanta lain yang memenuhi syarat, tetapi tidak setiap ekspresi memenuhi syarat. Variabel lokal, hasil fungsi, atau nilai yang dihitung saat runtime tidak dapat dipromosikan.
