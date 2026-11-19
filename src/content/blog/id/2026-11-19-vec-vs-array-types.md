---
title: "Gunakan Vec daripada Fixed Size Array"
description: "Vec menyediakan ukuran dinamis, keamanan stack, dan pencocokan pola pada variant. Box[T] tidak memiliki semantik partisi dan alokasi heap."
pubDate: 2026-11-19
tags: ["rust", "standard-library-types"]
category: "ARTICLES"
no: "18"
lang: "id"
draft: false
---

## TL;DR

Array pada stack membatasi ruang memori. `Vec` menawarkan kapasitas yang dapat disesuaikan, keamanan dalam urutan _drop_, dan iterasi yang sesuai _Rust idiomatic_. _Slices_ berukuran tetap dengan `Box<[T]>` mencegah partisi, menghindari risiko kesalahan saat proses _drop_, serta memperjelas semantik alokasi heap.

## Cara yang salah

```rust
let data = Box<[i32; 4]>;
let slice = &data[..];
match slice {
    [first, .., last] => println!("{} {}", first, last),
    _ => {}
}
```

_Slices_ berukuran tetap dengan struktur `Box<[T]>` memperlakukan memori sebagai sesuatu yang _opaque_ (tersembunyi). Partisi tidak diizinkan. Urutan _drop_ tidak jelas. Tidak tersedia ukuran dinamis maupun pelacakan kapasitas.

## Cara yang benar

```rust
let mut data = Vec::with_capacity(4);
data.push(1);
data.push(2);
data.push(3);
data.push(4);

if let [first, .., last] = data {
    println!("{} {}", first, last);
}
```

`Vec` memungkinkan perubahan ukuran secara dinamis. Pencocokan pola pada partisi dapat dilakukan dengan aman. Urutan _drop_ bersifat deterministik. Semantik stack tetap jelas dengan ukuran yang dapat dialokasikan di heap. Pelacakan kapasitas sudah tersedia secara bawaan.

## Q&A

**Kapan sebaiknya menggunakan Box<[T]> daripada Vec?**

Gunakan `Box<[T]>` hanya untuk _buffer_ berukuran tetap tanpa alokasi tambahan, interoperabilitas FFI, atau ketika ukuran harus ditentukan pada tingkat tipe. Untuk kasus lainnya, pilih `Vec`.

**Apakah operasi push pada Vec yang mengalami overflow dapat menyebabkan stack overflow?**

Tidak. Operasi `Vec` menggunakan alokasikan heap. _Stack overflow_ hanya terjadi akibat kedalaman rekursi atau alokasi berukuran tetap yang terbatas.
