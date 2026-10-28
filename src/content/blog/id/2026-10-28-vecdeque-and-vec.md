---
title: "VecDeque di Rust: Antrean FIFO Lebih Cepat Tanpa Overhead di Vector"
description: "Gunakan VecDeque daripada Vec saat membuat antrean FIFO di Rust. VecDeque menyediakan operasi push dan pop O(1) di kedua ujung menggunakan ring buffer yang efisien."
pubDate: 2026-10-28
tags: ["rust", "data-structures"]
category: "SNIPPET"
no: "04"
lang: "id"
draft: false
---

## TL;DR
Jangan gunakan `Vec::remove(0)` untuk antrean FIFO di Rust. Karena `Vec` menyimpan memori secara _contiguous_ (elemen-elemen disimpan dalam satu area memori yang berurutan), menghapus yang di depan memicu pergeseran elemen yang _expensive_ dengan kompleksitas O(n). Gunakan `VecDeque` sebagai gantinya untuk operasi enqueue dan dequeue O(1) teramortisasi (operation cost rata-rata dalam serangkaian proses agar tetap konstan) di kedua ujungnya.

## Cara yang salah
Misal menggunakan standard `Vec` sebagai antrean dengan mengambil elemen dari depan:

```rust
let mut tasks = Vec::new();
tasks.push("task_1");
tasks.push("task_2");
tasks.push("task_3");

let next_task = tasks.remove(0);
assert_eq!(next_task, "task_1");
```

Standard `Vec` mempertahankan satu blok memori dengan elemen-elemen yang tersusun. Memanggil `Vec::remove(0)` memaksa standard library untuk menyalin setiap item berikutnya dalam memori satu posisi ke depan melalui `ptr::copy`. Untuk antrean yang memproses banyak event, hal ini mengubah polling sederhana menjadi operasi O(n) per item, yang mengakibatkan waktu pemrosesan kuadratik O(n^2) secara keseluruhan serta mengakibatkan penurunan throughput yang parah pada beban tinggi.

## Cara yang benar
Menggunakan `VecDeque` dari `std::collections` sebagai antrean dua arah (double-ended queue):

```rust
use std::collections::VecDeque;

let mut tasks = VecDeque::new();
tasks.push_back("task_1");
tasks.push_back("task_2");
tasks.push_back("task_3");

let next_task = tasks.pop_front();
assert_eq!(next_task, Some("task_1"));
```

`VecDeque` mengimplementasikan _ring buffer_ yang ukurannya dapat bertambah, dengan penyimpanan di heap dalam satu blok memori yang berurutan. Alih-alih menyalin elemen saat menghapus elemen dari bagian depan antrean, struktur ini cukup memajukan indeks head internal dengan menggunakan aritmetika modular (perhitungan yang membungkus kembali posisi indeks ketika mencapai batas kapasitas buffer). Baik penambahan dengan `push_back` maupun pengambilan dengan `pop_front` beroperasi dalam waktu O(1) teramortisasi, menghasilkan throughput yang dapat diprediksi dan meminimalkan overhead pada CPU dari berapa banyak tugas tertunda yang tersisa di dalam buffer.

## Tanya Jawab

### Kapan sebaiknya memilih Vec daripada VecDeque?
Pilihlah `Vec` jika elemen hanya ditambahkan atau dihapus di bagian akhir, atau saat harus meneruskan slice berurutan secara langsung ke API yang membutuhkan `&[T]`. Karena `VecDeque` berputar di batas ring, item-itemnya dapat terbagi ke dalam dua slice terpisah dan bukan satu rentang memori yang berkesinambungan.

### Bagaimana VecDeque menangani alokasi memori saat bertambah besar?
`VecDeque` mengalokasikan ruang heap tambahan menggunakan kapasitas pangkat dua dan menggandakan penyimpanan pendukungnya setiap kali buffer terisi penuh. Selama realokasi, struktur ini mengurai circular buffer menjadi satu segmen-berurutan tunggal sehingga operasi push dan pop kedepannya tetap berjalan lancar.

### Bisakah mengonversi antara Vec dan VecDeque tanpa penurunan performa?
Ya, implementasi `From` di standard library memungkinkan konversi antara `Vec<T>` dan `VecDeque<T>` tanpa penyalinan data (zero-copy) selama penyelarasan buffer memungkinkannya. Hal ini memungkinkan untuk menyusun atau mengurutkan data secara efisien sebagai vektor sebelum mengubahnya menjadi antrean untuk dikonsumsi.
