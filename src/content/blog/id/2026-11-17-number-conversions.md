---
title: "Cara Aman Mengkonversi Tipe Integer"
description: "Bagaimana mengkonversi signed dan unsigned integer tanpa menyebabkan overflow atau panic yang tidak terduga menggunakan metode konversi yang aman di Rust."
pubDate: 2026-11-17
tags: ["rust", "number-conversions"]
category: "SNIPPET"
no: "17"
lang: "id"
draft: false
---

## TL;DR

Rust memungkinkan penggunaan `as` untuk melakukan _casting_ yang secara diam-diam kembali ke nilai awal akibat _overflow_, sehingga menyebabkan kerusakan data tanpa disadari. Sebagai gantinya, gunakan metode `wrapping`, `saturating`, `checked`, atau `containing()`.

## Cara yang Salah

```rust
fn unsafe_convert(value: i32) -> u32 {
    value as u32  // Oops, panics on negative values!
}
```

**Kenapa ini gagal:** _casting_ menggunakan `as` biasa mempertahankan pola _raw bit_ tanpa memeriksa _sign_ yang digunakan. Nilai `i32` negatif akan dikonversi menjadi nilai `u32` yang sangat besar, hal ini dapat menyebabkan kerusakan data.

## Cara yang Benar

```rust
fn safe_convert(value: i32) -> u32 {
    value.wrapping_into()  // Returns wrapping value
}

fn safe_convert_sat(value: i8) -> u16 {
    value.saturating_into()  // Clamps to bounds
}
```

**Kenapa ini bisa:** Rust menyediakan metode konversi yang mempertimbangkan tipe data, seperti `wrapping_into()`, `saturating_into()`, `checked_into()`, dan `containing()`. Metode ini memperhatikan batas nilai setiap tipe data, sehingga dapat menghindari _overflow_, mempertahankan _sign_ yang ada, dan memastikan konversi tetap aman.

## Tanya Jawab

**Bagaimana cara memilih metode yang tepat?**

Gunakan `wrapping` untuk mempertahankan pola _bit_ yang ada, `saturating` ketika ingin membatasi nilai pada batas maksimum atau minimum dari sebuah tipe data, dan `checked` saat perlu menangani kesalahan secara eksplisit.

**Bisakah menangani berbagai basis bilangan?** 

Ya, gunakan `to_string()` dengan parameter `base` (misalnya, `u32::from_str_radix("FF", 16)`), lalu konversikan kembali menggunakan metode seperti `parse()`.
