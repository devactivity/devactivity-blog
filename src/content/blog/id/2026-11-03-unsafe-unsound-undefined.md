---
title: "Unsound Rust: Jangan Pernah Ekspos Undefined Behavior ke Safe Code"
description: "Kode Rust yang unsound memungkinkan pemanggil yang menggunakan mode safe dapat memicu undefined behavior. Enkapsulasi blok unsafe dengan invariant yang ketat agar pemanggil di mode safe tidak melanggar kontrak."
pubDate: 2026-11-03
tags: ["rust", "unsafe,-unsound,-undefin"]
category: "SNIPPET"
no: "09"
lang: "id"
draft: false
---

## TL;DR

Kode dianggap _unsound_ jika kode yang safe dapat memicu _undefined behavior_. Sebuah blok _unsafe_ hanya dianggap _sound_ ketika API yang membungkusnya menjamin terpenuhinya seluruh _invariant_, sehingga tidak ada celah bagi pemanggil safe untuk melanggar kontrak compiler.

- Sound: Kode yang menjamin keamanan memori dan tidak memungkinkan pemanggil di mode safe memicu _undefined behavior_.
- Unsound: Kode Rust yang memungkinkan pemanggil di mode safe memicu _undefined behavior_.
- Safe: Kode Rust yang tidak menggunakan operasi _unsafe_ secara eksplisit dan dijamin memenuhi aturan keamanan Rust.
- Unsafe: Kode Rust yang mengizinkan operasi tertentu di luar jaminan keamanan compiler, sehingga programmer bertanggung jawab menjaga invariant-nya.
- Invarian: Kondisi yang harus selalu terpenuhi agar program tetap sesuai dan aman.

## Cara yang salah

```rust
pub fn parse_flag(byte: u8) -> bool {
    unsafe { std::mem::transmute(byte) }
}
```

Rust menjamin bahwa `bool` direpresentasikan dalam memori hanya dengan _byte value_ `0x00` (`false`) atau `0x01` (`true`). Melakukan _transmute_ terhadap bilangan bulat lainnya seperti saat memanggil `parse_flag(2)` akan menghasilkan nilai yang tidak valid dan langsung menyebabkan _Undefined Behavior_. Karena `parse_flag` diekspos sebagai fungsi _safe_, kode pemanggil yang safe dapat memicu pelanggaran ini tanpa perlu menulis blok `unsafe`. _Safe interface_ tidak boleh memungkinkan terjadinya _Undefined Behavior_, apapun _input safe_ yang diberikan. Pelanggaran terhadap aturan ini membuat implementasinya _unsound_.

## Cara yang benar

```rust
pub fn parse_flag(byte: u8) -> Option<bool> {
    match byte {
        0 => Some(false),
        1 => Some(true),
        _ => None,
    }
}

pub unsafe fn parse_flag_unchecked(byte: u8) -> bool {
    std::mem::transmute(byte)
}
```

Implementasi `parse_flag` yang safe memvalidasi input saat runtime, mengembalikan `None` untuk nilai byte yang tidak valid, serta memastikan bahwa pemanggil safe tidak dapat menghasilkan status boolean yang tidak valid. Jika tuntutan performa mengharuskan validasi runtime dilewati, operasi tersebut harus dideklarasikan sebagai `unsafe fn parse_flag_unchecked`. Menandai fungsi dengan kata kunci `unsafe` mengalihkan tanggung jawab pembuktian keamanan kepada pemanggil. Dengan demikian, pemanggil harus menggunakan blok `unsafe` eksplisit di lokasi pemanggilan dan memenuhi prasyarat yang terdokumentasi, yaitu bahwa `byte` harus bernilai `0` atau `1`.

## Tanya Jawab

### Apa perbedaan antara unsafe dan unsound?
Kode unsafe menggunakan fitur bahasa yang melewati pemeriksaan compiler, sehingga memerlukan verifikasi manual oleh developer terhadap _invariant safety_. Kode unsound adalah implementasi yang tidak sesuai di mana suatu API memungkinkan kode safe untuk melanggar invariant tersebut dan memicu _undefined behavior_.

### Bisakah blok unsafe ada di dalam fungsi safe yang sound?
Bisa, ini merupakan pola mendasar yang digunakan dalam standard library Rust. Blok `unsafe` internal bersifat sound jika fungsi yang membungkusnya memvalidasi semua input dan menjamin bahwa tidak ada interaksi dengan pemanggil safe yang dapat melanggar kontrak keselamatan yang dienkapsulasi.

### Kapan pembuat library harus menandai suatu fungsi sebagai unsafe?
Tandai fungsi sebagai `unsafe` setiap kali fungsi tersebut tidak dapat menjamin keamanan memori secara mandiri dan harus bergantung pada pemanggil untuk memenuhi invariant tertentu. Jika fungsi tersebut sepenuhnya dapat menjamin terpenuhinya seluruh invariant yang diperlukan, fungsi tersebut harus tetap safe.
