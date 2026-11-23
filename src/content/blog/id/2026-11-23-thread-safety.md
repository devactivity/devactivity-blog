---
title: "Keamanan Thread Rust: Berbagi State Mutable dengan Arc<Mutex<T>>"
description: "Berbagi mutable state antar-thread di Rust dengan Arc<Mutex<T>>, atau pilih immutable Arc<T> data ketika sinkronisasi tidak diperlukan dan, sehingga penggunaan lock dapat dihindari jika memungkinkan."
pubDate: 2026-11-23
tags: ["rust", "thread-safety"]
category: "SNIPPET"
no: "22"
lang: "id"
draft: false
---

## TL;DR

Gunakan `Arc<Mutex<T>>` untuk berbagi _mutable state_ yang dimiliki antar-thread di Rust. Jika datanya bersifat immutable, gunakan `Arc<T>` sebagai gantinya agar tidak perlu menggunakan lock.

## Cara yang salah

Bagian [Thread Safety pada cheats.rs](https://cheats.rs/#thread-safety) membedakan antara _shared ownership_ dan akses yang tersinkronisasi (_synchronized access_). Pointer yang dibagikan saja tidak cukup. `Arc` memungkinkan _shared ownership_, tetapi `RefCell` hanya menyediakan _interior mutability_ dalam satu thread. Memindahkan nilai ini ke dalam sebuah thread akan menyebabkan compile error:

```rust
use std::{cell::RefCell, sync::Arc, thread};

let data = Arc::new(RefCell::new(Vec::<u8>::new()));
thread::spawn(move || data.borrow_mut().push(1)).join().unwrap();
```

Masalahnya, `RefCell<T>` tidak mengimplementasikan `Sync`. Oleh karena itu, `Arc<RefCell<T>>` tidak dapat dikirim ke thread lain dengan aman karena `RefCell` tidak mengoordinasikan _borrow_ maupun mutasi secara _concurrent_. Compiler benar untuk menolak kode ini. Mengganti `RefCell` dengan `Mutex` menambahkan mekanisme sinkronisasi yang dibutuhkan oleh thread tersebut.

`RefCell` memeriksa _borrow_ saat runtime untuk penggunaan lokal dalam satu thread. Flag _borrow_-nya tidak mengoordinasikan akses antar-thread, dan membungkus nilai tersebut dalam `Arc` tidak mengubah jaminan tersebut.

## Cara yang benar

Bungkus data mutable dengan `Mutex`, lalu bagikan menggunakan `Arc`. Kloning handle untuk worker, dan gunakan lock hanya saat mengubah nilai:

```rust
use std::{sync::{Arc, Mutex}, thread};

let data = Arc::new(Mutex::new(Vec::<u8>::new()));
let worker = Arc::clone(&data);
thread::spawn(move || worker.lock().unwrap().push(1)).join().unwrap();
```

Sekarang, `Arc` menyediakan _shared ownership_, sedangkan `Mutex` hanya memastikan bahwa hanya satu thread yang dapat memegang akses _mutable_ pada satu waktu. _Guard_ yang dikembalikan oleh `lock()` membatasi _borrow_ pada cakupan bagian kritis (_critical section_) dan melepaskan lock ketika _guard_ tersebut dihapus (_drop_). Dalam contoh ini, `Vec<u8>` mengimplementasikan `Send`, sedangkan `Mutex<Vec<u8>>` mengimplementasikan `Sync`, sehingga _shared handle_ dapat dikirim melintasi batas thread.

`Arc` harus dipahami sebagai mekanisme _shared ownership_, bukan _shared access_. _Atomic reference count_-nya menjaga alokasi memori tetap tersedia, tetapi tidak melindungi isi data yang dibungkus oleh `Mutex`. Dengan kata lain, `Arc` menangani _lifetime_ dan _ownership_, sedangkan `Mutex` menangani _mutual exclusion_.

Usahakan agar bagian kritis tetap singkat. Melakukan pekerjaan lain yang tidak berkaitan saat memegang _guard_ dapat memblokir semua thread lain yang membutuhkan data yang sama. Jika nilai tersebut tidak pernah diubah, hilangkan `Mutex` dan gunakan `Arc<Vec<u8>>`, _immutable data_ yang mengimplementasikan `Sync` tidak memerlukan lock.

## Tanya Jawab

### Apakah `Arc` membuat `RefCell` aman digunakan lintas thread?

`Arc` tidak membuat `RefCell` aman lintas thread, `Arc` hanya memungkinkan  _shared ownership_ dan pembaruan _reference count_ yang aman. _Shared mutation_ tetap membutuhkan sinkronisasi, seperti yang disediakan oleh `Mutex`, karena `RefCell` tidak mengoordinasikan _borrow_ secara _concurrent_ antar-thread.

### Apa arti `Send` dan `Sync`?

`Send` berarti kepemilikan suatu nilai dapat dipindahkan ke thread lain, sedangkan `Sync` berarti _reference_ `&T` dapat dibagikan antar-thread dengan aman. `Arc<Mutex<Vec<u8>>>` dapat melintasi batas thread karena `Mutex` di dalamnya menyediakan akses yang tersinkronisasi.

### Mengapa `Arc` perlu dikloning sebelum membuat thread?

Setiap thread membutuhkan handle miliknya sendiri yang mengacu pada alokasi memori yang sama. `Arc::clone` menambah _reference count_ tanpa mengkloning `Vec`, dan alokasi memori tersebut tetap tersedia hingga handle terakhir dihapus (_dropped_).
