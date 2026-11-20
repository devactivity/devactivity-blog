---
title: "Closure mengambil variabel dengan cara yang berbeda dari fungsi"
description: "Pelajari bagaimana closure dapat mengambil variabel berdasarkan nilai, reference, atau mutable reference menggunakan sintaks yang berbeda"
pubDate: 2026-11-20
tags: ["rust", "closures"]
category: "SNIPPET"
no: "19"
lang: "id"
draft: false
---

## TL;DR

Closure mengambil variabel dari _scope_ tempat closure tersebut berada. Penggunaan `[|x| x * 2]` mengambil variable berdasarkan nilai, `[&mut y| y += 1]` mengambil dengan _mutable reference_, sedangkan `[&x| x]` mengambil variable berdasarkan _reference_.

## Cara yang salah

```rust
let data = 5;
let square = |x| x * data; // Error: `data` does not move into closure
```

Mengapa ini gagal: closure `|x| x * data` memiliki parameter `x` yang _belum diberi anotasi tipe_, dan tidak ada bagian dalam kode yang memberi tahu compiler tentang tipe parameter tersebut. Karena itu, compiler menghasilkan error `E0282: type annotations needed`. Variabel data yang diambil bukanlah sumber masalahnya. Closure dapat membaca variabel dari _scope_ di sekitarnya, dan Rust akan menyimpulkan cara variabel tersebut diambil (dalam kasus ini, menggunakan _shared reference_). Error ini akan hilang setelah tipe parameter ditentukan, baik dengan menambahkan anotasi tipe (`|x: i32|`) maupun dengan memanggil closure (`square(2)`). Pemanggilan ini memungkinkan compiler untuk menyimpulkan tipe `x` berdasarkan penggunaannya.

## Cara yang benar

```rust
let data = 5;
let square = |x| x * data;
assert_eq!(square(2), 10);
```

Mengapa ini berhasil: Pemanggilan `square(2)` memberikan informasi yang sebelumnya belum dimiliki compiler: `x` harus berupa _integer_. Karena itu, tipenya disimpulakn sebagai `i32` (tipe _integer_ default), dan closure tersebut memiliki signature `Fn(i32) -> i32`. Secara terpisah, closure tersebut membaca `data` dari _scope_ di sekitarnya. Karena isi closure hanya membaca variabel tersebut, Rust secara otomatis mengambilnya menggunakan _shared reference_, sehingga `data` tetap dapat diakses di dalam isi closure. Capture mode disimpulkan berdasarkan bagaimana isi closure menggunakan setiap variabel, bukan ditentukan oleh pengaturan default.

## Q&A

**Mode penangkapan apa saja yang ada?**

- `[|x| ...]` ambil dengan _value_ (mengambil _ownership_)
- `[&mut x| ...]` ambil dengan _mutable reference_ (variabel dapat diubah)
- `[&x| ...]` ambil dengan _immutable reference_ (read-only)

**Apa perbedaan closure dan fungsi?**

Closure memiliki aturan pengambilan data yang fleksibel, sehingga dapat mengakses variabel dari _scope_ di sekitarnya secara langsung. Sementara itu, fungsi tidak dapat mengambil variabel apa pun dan mengharuskan semua parameter diberikan secara eksplisit.

**Apakah closure dapat mengubah data yang diambil?**

Hanya jika diambil menggunakan _mutable reference_ `[&mut x]`. Pengambilan biasa memungkinkan closure membaca data, tetapi tidak mengubahnya.
