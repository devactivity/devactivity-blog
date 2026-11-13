---
title: "std::mem::take: Memindahkan Nilai dari Mutable Reference"
description: "Gunakan std::mem::take untuk mengambil ownership dari sebuah mutable reference, lalu menggantinya dengan nilai Default. Dengan demikian, bisa menghindari cloning yang tidak perlu sekaligus memenuhi aturan borrow checker."
pubDate: 2026-11-13
tags: ["rust", "miscellaneous"]
category: "SNIPPET"
no: "16"
lang: "id"
draft: false
---

## TL;DR

`std::mem::take` memungkinkan untuk mengambil _ownership_ dari sebuah _mutable reference_ dengan menggantinya menggunakan nilai `Default` dari tipe tersebut. Cara ini menghindari alokasi heap yang disebabkan oleh pemanggilan `.clone()` sebagai langkah defensif, tanpa melanggar aturan _aliasing_ maupun _move semantics_ (pemindarah _ownership_) di Rust.

## Cara yang salah

Saat mengambil data dari dalam sebuah _mutable struct reference_, memindahkan field secara langsung akan menyebabkan _compile error_ karena Rust tidak dapat mengizinkan memori yang sedang dipinjam berada dalam keadaan tidak terinisialisasi. Developer sering kali mengatasi _compile error_ dengan melakukan _cloning_ terhadap nilai tersebut:

```rust
struct Buffer {
    items: Vec<String>,
}

impl Buffer {
    fn drain_items(&mut self) -> Vec<String> {
        self.items.clone()
    }
}
```

Pemindahan field secara langsung akan ditolak oleh _borrow checker_ dengan error yang menyatakan bahwa nilai tidak dapat dipindahkan keluar dari konteks yang dipinjam. Meskipun penggunaan cloning dapat membuat kode berhasil di compile tanpa error, tindakan ini menyebabkan duplikasi data di heap dan menurunkan performa, terutama pada beban kerja yang menangani koleksi data berukuran besar.

## Cara yang benar

Panggil `std::mem::take` untuk mengambil _ownership_ sekaligus langsung mengatur ulang field yang direferensikan ke nilai default-nya:

```rust
use std::mem;

struct Buffer {
    items: Vec<String>,
}

impl Buffer {
    fn drain_items(&mut self) -> Vec<String> {
        mem::take(&mut self.items)
    }
}
```

`std::mem::take` dapat digunakan pada tipe apa pun yang mengimplementasikan trait `Default`. Fungsi ini menempatkan nilai `Default::default()` ke lokasi target dan mentransfer _ownership_ nilai sebelumnya secara langsung kepada pemanggil. Standard library seperti `Vec` menyediakan alokasi nilai kosong tanpa memerlukan alokasi memori tambahan, sehingga struct tetap berada dalam keadaan terinisialisasi sepenuhnya dan valid.

## Tanya Jawab

### Apa perbedaan antara `std::mem::take` dan `std::mem::replace`?
`std::mem::take(&mut x)` merupakan bentuk singkat yang lebih praktis dari `std::mem::replace(&mut x, Default::default())`. Gunakan `replace` ketika ingin mengganti nilai dengan instans khusus yang ditentukan sendiri, bukan dengan nilai default.

### Apakah `std::mem::take` melakukan alokasi memori saat mengosongkan koleksi standar?
Tidak, konstruktor default untuk tipe seperti `Vec`, `String`, dan `Option` menghasilkan representasi kosong tanpa memerlukan alokasi memori di heap. Proses pertukaran nilai ini hanya melibatkan pemindahan nilai melalui stack yang berlangsung dengan cepat.

### Kapan sebaiknya menghindari `std::mem::take`?
Hindari penggunaan `std::mem::take` ketika tipe yang digunakan tidak mengimplementasikan trait `Default`, atau ketika kondisi kosong dapat melanggar invariant struct. Dalam kasus seperti ini, gunakan `std::mem::replace` dengan pengganti yang valid dan sesuai dengan kebutuhan domain.
