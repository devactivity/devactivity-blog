---
title: "Rust One-Liners: Ambil Ownership dengan std::mem::take"
description: "Ekstrak ownership dari mutable borrow tanpa melakukan cloning dengan menggunakan std::mem::take untuk menggantinya dengan nilai default, sehingga menghindari alokasi heap dalam loop Rust yang berjalan intensif."
pubDate: 2026-11-10
tags: ["rust", "one-liners"]
category: "SNIPPET"
no: "13"
lang: "id"
draft: false
---

## TL;DR

Gunakan `std::mem::take` untuk mengekstrak nilai yang memiliki _ownership_ dari balik _mutable reference_ tanpa melakukan cloning. Fungsi ini menukar target dengan nilai `Default` dari tipenya secara langsung, sehingga menghindari alokasi heap sekaligus memenuhi aturan _borrow checker_ Rust hanya dengan satu baris kode yang idiomatik.

## Cara yang salah

```rust
struct Worker {
    buffer: Vec<String>,
}

impl Worker {
    fn flush(&mut self) -> Vec<String> {
        let data = self.buffer.clone();
        self.buffer.clear();
        data
    }
}
```

Developer sering kali melakukan cloning pada field kontainer ketika mengekstrak data yang memiliki _ownership_ dari _mutable reference_ ke sebuah struct. Jika `.clone()` dihapus, _rustc_ akan langsung menghasilkan error `E0507: cannot move out of self.buffer which is behind a mutable reference`. Compiler menegakkan aturan ini karena memindahkan vektor keluar dari struct dapat menyebabkan `self.buffer` berada dalam kondisi tidak terinisialisasi jika terjadi panic. Untuk mengatasi error tersebut, developer biasanya mengalokasikan memori heap tambahan untuk menduplikasi setiap string, kemudian langsung mengosongkan vektor aslinya. Salinan defensif ini menyebabkan aktivitas alokasi dan dealokasi heap yang tidak perlu (_heap churn_), menurunkan performa di runtime dalam pada loop yang intensif, serta membuat method dipenuhi kode tambahan (_boilerplate_) untuk proses pembersihan.

## Cara yang benar

```rust
use std::mem;

struct Worker {
    buffer: Vec<String>,
}

impl Worker {
    fn flush(&mut self) -> Vec<String> {
        mem::take(&mut self.buffer)
    }
}
```

Fungsi `std::mem::take` mengganti `self.buffer` dengan vektor kosong menggunakan `Default::default()`, lalu mengembalikan buffer asli dengan ownership penuh. Karena `Vec::default()` tidak melakukan alokasi memori heap, operasi ini dapat dilakukan secara efisien tanpa mengalokasikan ulang penyimpanan untuk elemen-elemennya. _Borrow checker_ menerima operasi ini karena `self.buffer` tetap berada dalam kondisi valid dan terinisialisasi selama proses pemindahan berlangsung. Dengan mengganti proses cloning yang bertele-tele menjadi satu pemanggilan fungsi yang idiomatik, bisa menghindari alokasi heap yang tidak perlu sekaligus menerapkan mekanisme transfer ownership secara tepat.

## Tanya Jawab

### Trait apa yang harus diimplementasikan oleh tipe target agar dapat menggunakan std::mem::take?
Tipe target harus mengimplementasikan `Default` agar Rust dapat mengganti nilainya secara langsung. Untuk tipe yang tidak mengimplementasikan `Default`, gunakan `std::mem::replace` agar dapat menentukan nilai pengganti secara eksplisit.

### Apa perbedaan antara std::mem::take dan std::mem::replace?
`take(&mut x)` merupakan bentuk ringkas yang lebih praktis dari `replace(&mut x, Default::default())`. Keduanya memiliki mekanisme dasar yang sama, yaitu mengganti nilai pada _mutable reference_ dan mengembalikan nilai sebelumnya. Namun, `take` membutuhkan lebih sedikit argumen karena secara otomatis menggunakan nilai default dari tipe tersebut.

### Apakah std::mem::take mengalokasikan memori heap baru?
Untuk tipe koleksi standar seperti `Vec`, `String`, atau `Option`, pemanggilan `Default::default()` menghasilkan representasi kosong tanpa melakukan alokasi heap. Dengan demikian, `mem::take` dapat memindahkan _ownership_ tanpa memerlukan alokasi heap tambahan pada runtime.
