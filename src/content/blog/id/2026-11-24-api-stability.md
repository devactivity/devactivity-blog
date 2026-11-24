---
title: "Stabilitas API Rust: Mengembangkan Enum Tanpa Merusak Klien"
description: "Stabilitas API Rust: tandai enum publik dengan `#[non_exhaustive]` agar penambahan variant tetap kompatibel pada tingkat source code, sementara match expression di sisi pengguna API tetap menyertakan wildcard arm yang sesuai."
pubDate: 2026-11-24
tags: ["rust", "api-stability"]
category: "SNIPPET"
no: "23"
lang: "id"
draft: false
---

## TL;DR

> Tandai enum publik dengan `#[non_exhaustive]`: wajibkan _wildcard arm_, lalu tambahkan variant tanpa menyebabkan compile error.

## Cara yang salah

Stabilitas API dimulai dengan menentukan perubahan di masa mendatang yang masih dapat diakomodasi oleh konsumen API. Untuk enum, penggunaan match yang _exhaustive_ merupakan jaminan bahwa kumpulan variant-nya bersifat tetap dan tidak akan bertambah. Berikut contoh library API sederhana beserta contoh klien yang menggunakannya:

```rust
pub enum Mode {
    Fast,
    Precise,
}
```

```rust
match mode {
    Mode::Fast => run_fast(),
    Mode::Precise => run_precise(),
}
```

Kode klien tersebut dapat di compile tanpa masalah saat ini. Masalah muncul ketika library menambahkan `Mode::Balanced`, _match expression_ pada kode klien tidak memiliki _arm_ untuk variant baru tersebut, sehingga pembaruan versi libary menyebabkan gagal compile. Mengganti nama atau menghapus variant juga akan menjadi perubahan yang merusak kompatibilitas. Dengan kata lain, enum yang diekspos secara publik tanpa penanda kompatibilitas ke depan membuat setiap penambahan variant di masa mendatang harus dipertimbangkan sebagai keputusan untuk versi mayor.

## Cara yang tepat

Tetapkan enum sebagai _non-exhaustive_ sebelum rilis, dan pastikan kode klien memperhitungkan kemungkinan adanya variant tambahan:

```rust
#[non_exhaustive]
pub enum Mode {
    Fast,
    Precise,
}
```

```rust
match mode {
    Mode::Fast => run_fast(),
    Mode::Precise => run_precise(),
    _ => fallback(),
}
```

Pada bagian API Stability `cheats.rs`, penambahan varian pada enum publik merupakan perubahan yang merusak kompatibilitas, kecuali jika enum tersebut ditandai dengan `#[non_exhaustive]`. Atribut ini merupakan solusi yang secara khusus ditujukan untuk mengatasi masalah tersebut, atribut ini menjadikan kelengkapan pencocokan menjadi kontrak eksplisit yang mengharuskan kode terkait mengantisipasi variant yang belum dikenal.

Atribut ini mengubah kontrak tersebut, crate terkait wajib menyertakan _arm catch-all_, sementara crate yang mendefinisikan enum dapat menambahkan variant baru di kemudian hari tanpa menyebabkan _match expression_ tersebut gagal di compile. Wildcard bukan berarti kode boleh mengabaikan atau salah menangani state baru begitu saja, bagian ini justru menjadi tempat untuk menentukan _fallback_ atau penanganan error secara sengaja. Ini merupakan salah satu langkah khusus untuk menjaga stabilitas API, bukan jaminan bahwa perilaku program tidak akan berubah. Jika `Balanced` mengubah semantik, dokumentasikan perubahan tersebut, lakukan pengujian, dan evaluasi apakah rilis tersebut tetap masih kompatibel.

## Q&A

### Apakah `#[non_exhaustive]` memungkinkan penambahan variant enum di kemudian hari?

Ya. Atribut ini memungkinkan penambahan variant tanpa menyebabkan compile error pada _match expression_ di dalam kode, dengan syarat library-nya telah menggunakan atribut tersebut sejak awal dan kode pengguna menyertakan _arm catch-all_.

### Apakah kode pengguna tetap dapat mencocokkan setiap variant yang sudah diketahui?

Bisa, tetapi _arm catch-all_ tetap wajib disertakan. Compiler mengharuskan kode yang menggunakan library tersebut untuk mengantisipasi kemungkinan adanya variant baru di masa mendatang, alih-alih menganggap bahwa daftar variant saat ini sudah lengkap.

### Apakah semua perubahan enum aman setelah atribut tersebut ditambahkan?

Tidak. Penambahan variant menjadi kompatibel pada tingkat source code, tetapi perubahan perilaku, perubahan tipe field, atau perubahan semantik tetap dapat merusak kompatibilitas dengan kode yang menggunakan library tersebut. Tinjau setiap perubahan berdasarkan aturan semantic versioning.
