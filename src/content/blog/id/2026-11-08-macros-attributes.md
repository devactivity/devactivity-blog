---
title: "Rust cfg_attr: Menerapkan Atribut Kondisional Secara Rapi"
description: "Gunakan atribut cfg_attr Rust untuk menerapkan derive dan trait pendukung hanya pada kondisi tertentu. Dengan begitu, tidak perlu menduplikasi deklarasi struct antara build untuk testing dan production."
pubDate: 2026-11-08
tags: ["rust", "macros-&-attributes"]
category: "ARTICLES"
no: "12"
lang: "id"
draft: false
---

## TL;DR
Jangan menduplikasi seluruh definisi tipe hanya untuk memenuhi kondisi di `#[cfg(...)]`. Gunakan `#[cfg_attr(predicate, attribute)]` untuk menerapkan derive, makro, atau compiler directives (sesuai teknis) secara kondisional langsung pada item kode. Dengan begitu, bisa menghindari perbedaan implementasi antar build dan beban maintenance kode yang tidak perlu.

## Cara yang salah
Ketika suatu struktur data membutuhkan implementasi trait tertentu selama pengujian seperti `Debug`, `Clone`, atau `PartialEq`, developer sering kali harus membuat 2 versi deklarasi yang berbeda dengan menggunakan _conditional compilation flag_ yang saling berlawanan.

```rust
#[cfg(test)]
#[derive(Debug, PartialEq, Clone)]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}

#[cfg(not(test))]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}
```

Mengapa cara ini gagal:
Menduplikasi deklarasi struct melanggar prinsip *single source of truth*. Ketika field berubah, kedua deklarasi harus diperbarui secara manual agar tetap sinkron. Satu perubahan yang terlewat dapat menyebabkan _compile error_ yang baru terdeteksi pada konfigurasi build tertentu. Selain itu, komentar dokumentasi, visibilitas field, dan atribut yang sudah ada juga harus dijaga dalam kedua deklarasi. Akibatnya, kode menjadi lebih rumit dan berisiko mengalami perbedaan implementasi yang tidak disadari antara binary debug dan release.

## Cara yang benar
Terapkan atribut yang diperlukan secara kondisional menggunakan `#[cfg_attr]` langsung satu definisi struct.

```rust
#[cfg_attr(test, derive(Debug, PartialEq, Clone))]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}
```

Mengapa cara ini berhasil:
Atribut `cfg_attr` menerima kondisi predikat yang diikuti oleh satu atau beberapa atribut untuk diterapkan ketika kondisi tersebut terpenuhi. Pada tahap prapemrosesan, Rust compiler mengevaluasi predikat tersebut. Jika hasil evaluasinya true, compiler akan menyertakan atribut-atribut di dalamnya ke item target, seolah-olah atribut tersebut ditulis langsung pada itemnya. Sebaliknya, jika kondisinya false,, atribut tersebut akan diabaikan sepenuhnya. Pendekatan ini menjaga definisi tata letak data, visibilitas, dan dokumentasi tetap konsisten dalam satu tempat, sekaligus memungkinkan kapabilitas tertentu diaktifkan sesuai kebutuhan, baik untuk rangkaian pengujian maupun melalui *feature gates* cargo.

## Tanya Jawab

### Bisakah `cfg_attr` menerapkan beberapa atribut sekaligus?
Ya, dengan mencantumkan beberapa atribut yang dipisahkan dengan tanda koma di dalam satu direktif _cfg_attr_, seperti `#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase"))]`.

### Apakah `cfg_attr` bisa diterapkan pada field dan varian secara individual?
Ya, dengan menempatkan `#[cfg_attr(...)]` pada field struct, varian dalam enum, modul, fungsi, atau item lain yang mendukung atribut luar (outer attributes) standar.

### Apa perbedaan `cfg_attr` dan `cfg` biasa?
Atribut `#[cfg(...)]` menentukan apakah suatu item disertakan atau dikecualikan dari proses compile. Sebaliknya, `#[cfg_attr(...)]` tidak mengecualikan item dari compile berdasarkan kondisinya. Atribut ini hanya menentukan apakah atribut atau metadata tertentu diterapkan pada item tersebut.
