---
title: "Alokasi Vec: Pra-alokasi dengan Vec::with_capacity"
description: "Dengan menentukan kapasitas sejak awal menggunakan Vec::with_capacity, dapat menghindari realokasi memori heap dan penyalinan data berulang kali saat vektor bertambah, asalkan jumlah elemennya sudah diketahui."
pubDate: 2026-11-12
tags: ["rust", "performance-tips"]
category: "SNIPPET"
no: "15"
lang: "id"
draft: false
---

## TL;DR
Jika panjang akhir vektor sudah diketahui atau bisa diperkirakan, gunakan `Vec::with_capacity` saat inisialisasi, bukan `Vec::new`. Dengan menyediakan kapasitas memori sejak awal, bisa menghindari realokasi heap berulang, menghindari persaingan akses pada lock alokator, dan mencegah penyalinan data yang tidak perlu.

## Cara yang salah
Membuat vektor kosong lalu menambahkan elemen satu per satu di dalam loop dapat menyebabkan realokasi heap berulang kali. Tanpa menentukan kapasitas sejak awal, runtime harus terus memperbesar buffer penyimpanan seiring bertambahnya elemen.

```rust
fn generate_squares(count: usize) -> Vec<usize> {
    let mut numbers = Vec::new();
    for i in 0..count {
        numbers.push(i * i);
    }
    numbers
}
```

`Vec::new()` dimulai dengan kapasitas nol, sehingga alokasi heap baru dilakukan saat elemen pertama ditambahkan menggunakan push. Ketika jumlah elemen terus bertambah hingga melebihi kapasitas yang tersedia, vektor akan meminta alokasi buffer yang lebih besar (biasanya dengan kapasitas dua kali lipat), lalu menyalin seluruh elemen yang sudah ada ke alokasi memori baru sebelum membebaskan buffer lama. Dalam loop yang membutuhkan performa tinggi atau layanan jaringan dengan throughput besar, realokasi berulang seperti ini dapat menyebabkan fragmentasi memori heap, meningkatkan kontensi antarproses saat mengakses alokator, dan membuang siklus CPU yang seharusnya bisa digunakan untuk pekerjaan lain akibat penyalinan data yang tidak perlu.

## Cara yang benar
Tentukan kebutuhan memori sejak awal menggunakan `Vec::with_capacity` setiap kali jumlah elemen sudah diketahui atau setidaknya memiliki batas yang jelas.

```rust
fn generate_squares(count: usize) -> Vec<usize> {
    let mut numbers = Vec::with_capacity(count);
    for i in 0..count {
        numbers.push(i * i);
    }
    numbers
}
```

`Vec::with_capacity(count)` melakukan satu kali alokasi heap dengan kapasitas yang cukup untuk menampung seluruh elemen sejak awal. Karena ruang penyimpanan sudah tersedia, setiap pemanggilan `push` berikutnya bisa langsung menambahkan elemen ke area memori yang berurutan sekaligus memperbarui penghitung panjang vektor. Dengan begitu, tidak ada lagi overhead akibat realokasi, pemanggilan memcpy yang tidak perlu dapat dihindari, dan data tetap tersimpan secara berurutan sehingga lebih ramah terhadap cache CPU. Proses penambahan elemen juga memiliki kompleksitas waktu dengan O(1).

## Tanya Jawab

### Apakah Iterator::collect melakukan optimasi secara otomatis?
Ya, iterator standard untuk _range_ dan _slice_ mengimplementasikan `ExactSizeIterator`, sehingga `collect::<Vec<_>>()` dapat mengetahui jumlah elemen melalui `size_hint()` dan secara otomatis menyediakan kapasitas yang sesuai sejak awal.

### Apa dampak performa jika kapasitas yang dialokasikan terlalu besar?
Mengalokasikan kapasitas melebihi kebutuhan akan membuang ruang memori heap dan meningkatkan penggunaan memori aplikasi. Jika seluruh elemen sudah dimasukkan, maka bisa mengembalikan ruang buffer yang tidak terpakai dengan memanggil `Vec::shrink_to_fit()`.

### Kapan Vec::new masih menjadi pilihan yang lebih baik?
Gunakan `Vec::new()` jika vektor sering kali tidak berisi elemen atau jika program mungkin berhenti lebih awal akibat pemeriksaan kesalahan sebelum elemen sempat ditambahkan. `Vec::new()` membuat object vektor dengan overhead minimal tanpa melakukan alokasi heap hingga elemen pertama ditambahkan menggunakan push.
