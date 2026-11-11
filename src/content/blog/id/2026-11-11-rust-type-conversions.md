---
title: "Konversi Tipe di Rust: Implementasikan From, Bukan Into"
description: "Implementasikan trait From, bukan Into, untuk konversi tipe Rust yang tidak mudah gagal. Dengan demikian, implementasi Into untuk konversi yang sama beserta dukungan standard library akan didapatkan secara otomatis."
pubDate: 2026-11-11
tags: ["rust", "type-conversions"]
category: "SNIPPET"
no: "14"
lang: "id"
draft: false
---

## TL;DR
Selalu implementasikan `From`, bukan `Into`, untuk konversi tipe yang tidak bisa gagal (_infallible_). Rust menyediakan _blanket implementation_ (implementasi umum) untuk `Into` pada setiap tipe yang mengimplementasikan `From`. Dengan demikian, bisa menggunakan sintaks konstruktor secara langsugn maupun merangkai pemanggilan metode generik tanpa perlu menduplikasi boilerplate berulang kali.

## Cara yang salah
```rust
struct UserId(u64);

// Implementing Into directly for a custom type
impl Into<UserId> for u64 {
    fn into(self) -> UserId {
        UserId(self)
    }
}

fn main() {
    let id: UserId = 42u64.into();
    // Fails to compile: UserId::from(42u64) is not implemented!
    // let id2 = UserId::from(42u64);
}
```
Mengimplementasikan `Into` secara langsung memang memungkinkan pemanggilan `.into()`, tetapi tidak menyediakan implementasi kebalikannya yaitu `From`. Standard Library Rust memiliki _blanket implementation_ yang hanya berlaku satu arah: implementasi `From` secara otomatis menyediakan implementasi `Into`, tetapi tidak berlaku sebaliknya. Mengimplementasikan `Into` secara manual membuat pengguna tipe tersebut tidak dapat menggunakan `UserId::from(...)` sebagai sintaks konstruktor yang lebih mudah dibaca. Akibatnya, fungsi generik yang menggunakan _trait bound_ `T: From<U>` tidak dapat menerima tipe terrsebut. Hal ini membuat tipe yang tidak mengikuti  konversi idiomatik Rust dan memaksa pengguna kode untuk mencari solusi altelrnatif yang kurang praktis.

## Cara yang benar
```rust
struct UserId(u64);

// Implement From instead of Into
impl From<u64> for UserId {
    fn from(value: u64) -> Self {
        UserId(value)
    }
}

fn main() {
    // Both conversion styles work seamlessly
    let id1 = UserId::from(42u64);
    let id2: UserId = 42u64.into();
}
```
Mengimplementasikan `From` secara otomatis menghasilkan implementasi timbal balik `Into` melalui aturan _blanket implementation_ dari standard library: `impl<T, U> Into<U> for T where U: From<T>`. Desain ini memungkinkan kedua cara konversi digunakan, pemanggilan konstruktor secara eksplisit melalui `UserId::from(...)` dan pemanggilan _method chaining_ melalui `value.into()`. Karena implementasi `Into` disediakan secara otomatis, maka tidak perlu memilih salah satu di antara kedua cara tersebut. Pengguna dapat menggunakan keduanya tanpa perlu implementasi tambahan, sekaligus tetap mengikuti konvensi standard library Rust.

## Tanya Jawab
### Kapan sebaiknya mengimplementasikan Into secara langsung?
Hanya dalam kasus khusus yang jarang terjadi, ketika berurusan dengan tipe eksternal dan _orphan rule_ yang mencegah pengimplementasian `From`. Dalam praktiknya, hampir semua konversi _infallible_ tipe kustom, baik di dalam crate maupun antara tipe-tipe lokal, sebaiknya menggunakan `From`.

### Bagaimana jika konversinya bisa gagal saat runtime?
Implementasikan `TryFrom`, bukan `From`, untuk menghasilkan nilai `Result<T, Error>`. Standard library juga menyediakan _blanket implementation_ untuk `TryInto` setiap kali `TryFrom` diimplementasikan.

### Apa perbedaan tujuan antara From dan AsRef?
`From` mengonsumsi sebuah nilai dan mengonversinya menjadi nilai lain yang dimiliku sepenuhnya (_owned_). Proses ini memungkinkan transformatsi struktur data. Sementara itu, `AsRef` mengonversi _reference_ menjadi _reference_ lain secara efisien tanpa mengalokasikan memori atau mengambil alih _ownership_ data yang dirujuk.
