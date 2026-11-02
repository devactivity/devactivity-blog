---
title: "Lifetime di Rust: Menotasikan Reference pada Fungsi"
description: "Rust memerlukan anotasi lifetime eksplisit saat re-return reference dari banyak input agar borrow checker dapat melacak validitas lintas cakupan fungsi."
pubDate: 2026-10-31
tags: ["rust", "memory-&-lifetimes"]
category: "SNIPPET"
no: "06"
lang: "id"
draft: false
---

## TL;DR

Rust tidak dapat menentukan _reference_ mana yang dikembalikan oleh sebuah fungsi ketika beberapa input yang dipinjam (_borrowed_) diberikan. Anotasi lifetime yang eksplisit tidak mengubah perilaku runtime, anotasi tersebut menetapkan [static contract](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) (kontrak yang diperiksa oleh compiler pada _compile time_) yang memungkinkan compiler menjamin bahwa _reference_ yang dikembalikan tidak pernah valid lebih lama daripada data sumbernya.

## Cara yang salah

```rust
fn pick_longest(first: &str, second: &str) -> &str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

Berdasarkan aturan [_lifetime elision_](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html?highlight=elision#lifetime-elision) di Rust, setiap parameter input mendapatkan lifetime anonim yang berbeda. Karena fungsi tersebut dapat mengembalikan _reference_ ke `first` maupun `second`, compiler tidak dapat menentukan lifetime parameter mana yang berlaku untuk tipe pengembalian. Ketika batasan lifetime bersifat ambigu, _borrow checker_ tidak dapat menjamin bahwa _reference_ yang dihasilkan akan tetap valid saat fungsi dipanggil (_call site_). Akibatnya, compiler dihentikan dengan error `E0106: missing lifetime specifier`.

## Cara yang benar

```rust
fn pick_longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

Pengenalan parameter lifetime generik `'a` mendeklarasikan hubungan eksplisit antara input dan output. Kontrak ini memberi tahu _borrow checker_ bahwa _reference_ yang dikembalikan terikat pada kedua argumen dan hanya berlaku selama lifetime argumen yang memiliki durasi lifetime lebih pendek. Compiler memverifikasi secara statis bahwa pemanggil tidak akan pernah mengakses _slice_ yang dikembalikan setelah salah satu _buffer_ keluar dari cakupannya (out of scope), tanpa menimbulkan overhead tambahan saat runtime.

## Tanya Jawab

### Apakah anotasi lifetime memengaruhi berapa lama variabel tersimpan di memori?
Tidak, anotasi lifetime murni merupakan penanda waktu compile yang digunakan oleh borrow checker. Anotasi ini tidak mengubah cakupan alokasi memori, urutan eksekusi, maupun proses penghancuran objek (drop).

### Kapan anotasi lifetime pada fungsi dapat dihilangkan dengan aman?
Anotasi dapat dihilangkan selama aturan standar _lifetime elision_ berlaku, misalnya fungsi yang hanya menerima satu parameter berupa _reference_ atau method yang meminjam `&self`. Dalam kasus tersebut, Rust secara otomatis menghubungkan lifetime input dengan lifetime _reference_ yang dikembalikan.

### Bagaimana compiler menangani dua argumen dengan scope yang berbeda?
Rust menetapkan `'a` berdasarkan lifetime yang lebih pendek dari keduanya di titik pemanggilan (call site). Oleh karena itu, _reference_ yang dikembalikan hanya berlaku dalam cakupan yang lebih sempit untuk mencegah _dangling pointer_.
