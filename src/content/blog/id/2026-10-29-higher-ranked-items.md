---
title: "Higher-Ranked Trait Bounds: Menggunakan for<'a> di Rust"
description: "Higher-ranked trait bounds (HRTB) menggunakan for<'a> untuk mendeklarasikan lifetime yang berlaku untuk durasi apa pun, sehingga closure dapat meminjam data lokal yang dibuat di dalam fungsi."
pubDate: 2026-10-29
tags: ["rust", "higher-ranked-items"]
category: "SNIPPET"
no: "05"
lang: "id"
draft: false
---

## TL;DR

Higher-ranked trait bounds (`for<'a>`) memungkinkan fungsi menerima closure yang dapat bekerja dengan _reference_ dengan _lifetime_ apa pun. Gunakan _HRTB_ ketika closure perlu meminjam (`borrow`) value berumur pendek yang dibuat di dalam fungsi, alih-alih _reference_ yang disediakan oleh pemanggil.

## Cara yang salah

Menempatkan parameter _lifetime_ langsung pada fungsi generik memungkinkan pemanggil untuk menentukan _lifetime_ tersebut. Hal ini menyebabkan kesalahan compile setiap kali program mencoba meneruskan _reference_ ke data yang dialokasikan secara lokal:

```rust
fn inspect_data<'a, F>(f: F)
where
    F: Fn(&'a str),
{
    let local = String::from("temporary");
    f(&local);
}
```

Kode ini gagal di compile dengan error: `local does not live long enough`. Karena `'a` dideklarasikan pada `inspect_data`, pemanggil memilih `'a` sebelum memasuki fungsi, yang mengharuskan _reference_ tersebut bertahan lebih lama daripada _execution frame_ si fungsi. Variabel string lokal `local` dialokasikan di _stack_ dan di-_drop_ pada akhir blok, yang berarti _lifetime_-nya tidak dapat memenuhi _lifetime_ `'a` yang dikontrol oleh pemanggil.

## Cara yang benar

Gunakan higher-ranked trait bounds dengan `for<'a>` untuk menyatakan bahwa closure dapat menerima _reference_ dengan kemungkinan lifetime apa pun, termasuk _lifetime_ singkat dari variabel lokal di stack:

```rust
fn inspect_data<F>(f: F)
where
    F: for<'a> Fn(&'a str),
{
    let local = String::from("temporary");
    f(&local);
}

fn main() {
    inspect_data(|text| println!("{text}"));
}
```

Dengan `for<'a>`, [universal quantifier](https://doc.rust-lang.org/stable/reference/trait-bounds.html?utm_source=chatgpt.com#higher-ranked-trait-bounds) mengikat lifetime secara langsung pada trait bound, bukan pada fungsi luar. Closure menjamin bahwa ia dapat menangani _reference_ dengan _lifetime_ apa pun yang diberikan oleh fungsi pemanggil (callee). Dengan demikian, `inspect_data` dapat mengalokasikan data secara internal, meminjamnya sebentar selama durasi pemanggilan `f`, lalu men-dealokasikannya (membebaskan alokasi) dengan aman ketika _scope_ berakhir.

```bash
|       Call          |     Caller     |    Callee      |
| ------------------- | -------------- | -------------- |
| `inspect_data(...)` | `main()`       | `inspect_data` |
| `f(&local)`         | `inspect_data` | The closure    |
```

## Tanya Jawab

### Bisakah sintaks for<'a> dihilangkan untuk closure?
Ya. Aturan _lifetime elision_ pada Rust secara otomatis mengembangkan batasan trait untuk closure seperti `F: Fn(&str)` menjadi `F: for<'a> Fn(&'a str)`.

### Kapan sintaks for<'a> harus ditulis secara eksplisit?
`for<'a>` harus ditulis secara eksplisit ketika menyatakan hubungan yang kompleks antar-lifetime, misalnya dengan mengikat _lifetime input_ ke _lifetime reference output_ melalui `F: for<'a> Fn(&'a str) -> &'a str`.

### Apakah higher-ranked trait bounds menambah overhead di runtime?
Tidak. Higher-ranked trait bounds divalidasi secara ketat pada saat compile oleh _borrow checker_ dan tidak menghasilkan overhead runtime atau indireksi heap sama sekali.
