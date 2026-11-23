---
title: "Anatomi Proyek Rust: Cargo, Modul, dan Tes"
description: "Tata letak Cargo pada Rust merupakan sekumpulan konvensi: entry file menentukan root crate, deklarasi mod menghubungkan modul, dan integration test hanya dapat mengakses API publik."
pubDate: 2026-11-22
tags: ["rust", "project-anatomy"]
category: "SNIPPET"
no: "21"
lang: "id"
draft: false
---

## TL;DR

Cargo tidak menemukan modul secara otomatis berdasarkan direktori. `src/lib.rs` mendefinisikan root crate, deklarasi `mod` membuat berkas (proyek) dapat diakses sebagai modul, dan direktori `tests/` digunakan untuk menguji API publik. Pastikan batas-batas tersebut dinyatakan secara eksplisit.

## Cara yang salah

Pertimbangkan sebuah library sederhana bernama `greeting` yang memiliki berkas `src/lib.rs`, `src/format.rs`, dan `tests/format.rs`. Modul _formatter_ tersebut sudah tersedia, tetapi root library tidak menyambungkannya:

```rust
// src/format.rs
pub fn shout(text: &str) -> String {
    text.to_uppercase()
}
```

```rust
// src/lib.rs
// no `mod format;`
```

Sekarang, dengan integration test mencoba menggunakan fungsi tersebut:

```rust
// tests/format.rs
#[test]
fn shouts() {
    assert_eq!(greeting::shout("hi"), "HI");
}
```

Tes ini gagal karena Cargo tidak memindai direktori `src/` untuk menemukan modul secara otomatis. `src/lib.rs` merupakan root dari modul crate, dan `format.rs` tidak dapat diakses melalui root tersebut. Integration test bertindak sebagai konsumen external crate, sehingga hanya dapat memanggil item yang diekspos oleh library, `greeting::shout` tidak diekspos. Sebuah berkas dapat berada di direktori yang tepat, tetapi tetap tidak memberikan pengaruh apapun terhadap crate.

## Cara yang benar

Deklarasikan modul dari root crate dan ekspor ulang fungsinya secara eksplisit:

```rust
// src/lib.rs
mod format;

pub use format::shout;
```

Integration test yang sama sekarang bisa berhasil:

```rust
// tests/format.rs
#[test]
fn shouts() {
    assert_eq!(greeting::shout("hi"), "HI");
}
```

`mod format;` memberi tahu Rust untuk memuat `src/format.rs` sebagai modul yang merujuknya. `pub use format::shout;` membuat jalur publik di root crate, sehingga `greeting::shout` dapat diakses oleh pemanggil. Perbedaan pentingnya adalah bahwa direktori yang umum digunakan dalam Cargo hanyalah konvensi, sedangkan compiler mengikuti struktur modul yang dideklarasikan.

Dengan demikian, terdapat dua hubungan yang berbeda. Deklarasi modul menghubungkan nama dengan berkas, sedangkan visibilitas menentukan nama mana yang dapat diakses dari luar crate. Cargo dan compiler menerapkan aturan yang berbeda untuk masing-masing hubungan tersebut. Oleh karena itu, keberhasilan proses build tetap bergantung pada pendefinisian jalur yang diinginkan secara eksplisit.

Untuk contoh sederhana ini, struktur direktori dan berkasnya adalah sebagai berikut:

```text
greeting/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   └── format.rs
└── tests/
    └── format.rs
```

`Cargo.toml` menentukan nama package, `src/lib.rs` menjadi titik awal library, dan `tests/` berisi tes yang menguji API publik. Tes tersebut tidak mengimpor `format.rs` secara langsung, melainkan menggunakan API publik crate, sama seperti pengguna yang menggunakan libary tersebut sebagai dependensi. Jika sebuah tes perlu memeriksa private helper yang ada, menempatkan tes tersebut berdampingan dengan implementasi di dalam `src/` menjadikan unit test sebagai pilihan yang lebih tepat. Pemisahan ini menjaga kontrak publik library tetap eksplisit sekaligus memungkinkan detail internal diuji di dekat kode implementasinya.

## Tanya Jawab

### Apakah Cargo secara otomatis menyertakan setiap berkas `.rs`?

Tidak. Hanya modul yang terhubung ke root crate melalui deklarasi `mod` yang akan di compile sebagai bagian dari crate tersebut. Berkas lain yang tidak terhubung dapat tetap berada di dalam direktori proyek tanpa digunakan.

### Di mana sebaiknya unit test ditempatkan?

Letakkan unit test berdampingan dengan implementasinya di dalam `src/` jika tes tersebut perlu mengakses item privat. Sementara itu, letakkan integration test di dalam `tests/` jika tes tersebut harus berperilaku seperti pengguna eksternal crate.

### Apakah `src/main.rs` selalu menjadi titik masuk?

Untuk binary package, `cargo run` secara bawaan menggunakan `src/main.rs`. Sementara itu, library biasanya menggunakan `src/lib.rs` sebagai root crate, sedangkan binary tambahan dapat ditempatkan di dalam `src/bin/`.
