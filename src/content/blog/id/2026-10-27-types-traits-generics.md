---
title: "dyn Trait: Return Berbagai Tipe di Runtime"
description: "Rust memerlukan satu tipe konkret untuk tipe return impl Trait. Untuk return berbagai tipe saat di runtime, bisa dengan memasukkannya ke dalam dynamic trait object."
pubDate: 2026-10-27
tags: ["rust", "types,-traits,-generics"]
category: "VIDEO"
youtubeId: "zLE7jXlGub8"
no: "03"
lang: "id"
draft: false
---

## TL;DR

`impl Trait` pada Rust menggunakan _static dispatch_ dan mewajibkan setiap _branch_ (execution path didalam kode) me-return tipe konkret yang sama persis. Ketika kondisi runtime mengharuskan return tipe-tipe berbeda yang mengimplementasikan trait yang sama, maka cukup gunakan _boxed trait object_ seperti `Box<dyn Trait>`.

## Cara yang salah

```rust
trait Formatter {
    fn format(&self, text: &str) -> String;
}

struct Plain;
struct Bold;

impl Formatter for Plain {
    fn format(&self, text: &str) -> String {
        text.to_string()
    }
}

impl Formatter for Bold {
    fn format(&self, text: &str) -> String {
        format!("**{text}**")
    }
}

fn get_formatter(is_bold: bool) -> impl Formatter {
    if is_bold {
        Bold
    } else {
        Plain
    }
}
```

Compile akan gagal di fungsi `get_formatter` dengan eror `E0308: 'if' and 'else' have incompatible types`. Meskipun `Bold` dan `Plain` sama-sama mengimplementasikan `Formatter`, `impl Trait` pada posisi return tidak mengaktifkan _dynamic dispatch_. Sintaks ini merepresentasikan satu tipe konkret tunggal yang ditentukan saat compile. Karena `Bold` dan `Plain` adalah tipe berbeda dengan layout yang berbeda, compiler tidak dapat menggabungkannya ke dalam satu _static signature_ (satu tipe konkret yang diketahui saat compile).

## Cara yang benar

```rust
fn get_formatter(is_bold: bool) -> Box<dyn Formatter> {
    if is_bold {
        Box::new(Bold)
    } else {
        Box::new(Plain)
    }
}

fn main() {
    let formatter = get_formatter(true);
    println!("{}", formatter.format("hello"));
}
```

Dengan me-return`Box<dyn Formatter>`, fungsi tersebut menghasilkan sebuah trait object yang didukung oleh _dynamic dispatch_. Sebuah trait object menggabungkan pointer ke instans yang di alokasi heap dengan pointer ke tabel metode virtual ([vtable](https://doc.rust-lang.org/reference/types/trait-object.html))-nya. Karena `Box<Bold>` dan `Box<Plain>` sama-sama ter-coerce menjadi tipe _fat pointer_ yang identik yaitu `Box<dyn Formatter>`, setiap _conditional branch_ me-return tipe seragam dengan size yang sudah diketahui saat compile sembari mengeksekusi method di runtime.

## Tanya Jawab

### Adakah dampak performa dari dynamic dispatch?
Trait object memerlukan alokasi heap melalui `Box` dan pemanggilan method secara tidak langsung melalui [vtable](https://doc.rust-lang.org/reference/types/trait-object.html), yang mencegah inlining oleh compiler. Overhead kecil ini dapat diabaikan untuk _branching logic_ yang memang membutuhkan perilaku polimorfik di runtime.

### Bisakah enum menggantikan Box<dyn Trait>?
Bisa, jika semua kemungkinan varian sudah diketahui sebelumnya di dalam crate. Dengan membungkus implementasi ke dalam sebuah enum dapat menghindari alokasi heap dan _dynamic dispatch_ sekaligus mempertahankan polimorfisme tertutup.

### Mengapa tidak menggunakan impl Trait dengan dyn Trait unboxed?
Raw `dyn Trait` bersifat unsized (`!Sized`) karena setiap struct yang mengimplementasikannya membutuhkan ruang memori yang bervariasi. Rust mewajibkan return value dari fungsi memiliki ukuran yang diketahui saat compile, sehingga membutuhkan bentuk seperti `Box` atau `&`.
