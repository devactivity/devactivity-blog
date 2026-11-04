---
title: "Rust Idiomatis: Gunakan &str daripada &String"
description: "Terima &str daripada &String sebagai argumen fungsi di Rust agar pemanggil dapat meneruskan string literal, slice, maupun String yang dimiliki tanpa perlu melakukan alokasi heap."
pubDate: 2026-11-04
tags: ["rust", "idiomatic-rust"]
category: "SNIPPET"
no: "10"
lang: "id"
draft: false
---

## TL;DR

Jangan gunakan `&String` sebagai parameter fungsi read-only di Rust. Sebagai gantina, gunakan `&str`. Berkat _deref coercion_, `&str` dapat menangani string slice, string literal, maupun _reference_ ke `String` yang dimiliki dengan baik tanpa memerlukan alokasi heap yang tidak perlu.

## Cara yang salah

```rust
fn count_words(text: &String) -> usize {
    text.split_whitespace().count()
}

fn main() {
    let greeting = "hello world";
    let count = count_words(&greeting.to_string());
    println!("Word count: {count}");
}
```

Mengharuskan penggunaan _reference_ `&String` membatasi pemanggil untuk hanya memberikan _reference_ ke _buffer string_ yang dialokasikan di heap. Ketika pemanggil memiliki _string literal_ atau _slice substring_ yang sudah ada (`&str`), Rust tidak dapat melakukan _coercion_ dari `&str` menjadi `&String`. Akibatnya, pemanggil harus mengalokasikan objek `String` baru di heap menggunakan `.to_string()` atau `.to_owned()` hanya untuk memenuhi tipe parameter tersebut. Pola ini boros memori, menurunkan performa di runtime, serta membuat API publik menjadi kaku dan tidak praktis untuk digunakan.

## Cara yang benar

```rust
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

fn main() {
    let literal: &str = "hello world";
    let owned: String = String::from("idiomatic rust patterns");

    let c1 = count_words(literal);
    let c2 = count_words(&owned);

    println!("Counts: {c1}, {c2}");
}
```

`&str` adalah _string slice_ yang tidak memiliki data _string_ itu sendiri (`unowned`), tipe ini merupakan _fat pointer_ yang menyimpan alamat memori dan panjang datanya. Dengan menerima `&str`, fungsi tidak perlu mengetahui bagaimana atau di mana _byte_ penyusun _string_ tersebut disimpan. Tipe ini digunakan secara langsung dengan _string literal_ yang berada di memori statis, _sub-slice_ dari buffer yang ada, maupun instance `String` yang dimiliki datanya sendiri. Karena `String` mengimplementasikan `Deref<Target = str>`, pemanggilan fungsi dengan `&owned` secara otomatis mengalami _coercion_ menjadi `&str` pada waktu compile, tanpa overhead tambahan di runtime maupun alokasi heap. Kebiasaan sederhana ini membuat API lebih ergonomis sekaligus mempertahankan performa yang optimal.

## Tanya Jawab

### Apakah prinsip ini juga berlaku untuk koleksi seperti Vec<T>?
Ya, prinsip yang sama berlaku di seluruh standard library. Fungsi sebaiknya menerima _reference slice_ `&[T]` daripada `&Vec<T>`. Dengan begitu, pemanggil dapat meneruskan _array_ berukuran tetap yang disimpan di stack, sub-slice, maupun `Vec<T>` yang dialokasikan di heap menggunakan cara yang samamenggunakan cara yang sama.

### Kapan sebuah fungsi sebaiknya menerima &String?
Hampir tidak pernah jika hanya untuk membaca data (read-only). Jika fungsi hanya perlu membaca teks, gunakan `&str`. Namun, jika fungsi perlu memodifikasi _string_ secara langsung, gunakan _reference_ mutable `&mut String` sebagai gantinya.

### Bagaimana jika sebuah fungsi membutuhkan salinan owned string?
Terima `String` secara langsung sebagai nilai (by value) atau gunakan `impl Into<String>`. Dengan begitu, pemanggil yang sudah memiliki `String` dapat mentransfer _ownership_-nya tanpa memicu alokasi heap tambahan. Sementara itu, pemanggil yang memiliki `&str` dapat membuat salinan (clone) secara eksplisit sebelum meneruskannya ke fungsi.
