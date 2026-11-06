---
title: "Loop Rust: Mengembalikan Nilai Langsung dengan break"
description: "Loop di Rust adalah ekspresi yang dapat mengembalikan nilai secara langsung melalui break. Hindari penggunaan variabel akumulator mutabel di luar loop, dan tetapkan hasilnya langsung dari ekspresi loop tersebut."
pubDate: 2026-11-06
tags: ["rust", "control-flow"]
category: "SNIPPET"
no: "10"
lang: "id"
draft: false
---

## TL;DR

Di Rust, `loop` adalah sebuah ekspresi yang dapat meneruskan nilai ke `break` untuk mengembalikan data secara langsung dari loop, sehingga tidak perlu menggunakan variabel `mut` di luar loop dan tetap menjaga perulangannya, polling-nya, maupun sistem pencariannya tetap ringkas dan aman.

## Cara yang salah

Developer yang terbiasa dengan bahasa di mana loop merupakan statement sering kali mengandalkan _mutable state_ di luar loop untuk mengekstrak nilai:

```rust
let mut result = None;
let mut attempts = 0;

loop {
    attempts += 1;
    if attempts == 3 {
        result = Some(attempts * 10);
        break;
    }
}

let final_val = result.unwrap();
```

Pola ini membuat scope luar dipenuhi variabel _mutable_ yang sebenarnya tidak diperlukan dan memaksakan untuk menginisialisasi _placeholder_ seperti `Option`. Hal ini menambah _boilerplate_, mengurangi jaminan keamanan tipe, serta berisiko menyebabkan _runtime panic_ jika `result` di-unwrap tanpa sempat diisi nilai.

## Cara yang benar

Gunakan konstruksi `loop` sebagai ekspresi dengan memberikan nilai balik ke `break`:

```rust
let mut attempts = 0;

let final_val = loop {
    attempts += 1;
    if attempts == 3 {
        break attempts * 10;
    }
};
```

Karena `break` menerima sebuah ekspresi, Rust memperlakukan seluruh loop sebagai ekspresi yang menghasilkan nilai dengan tipe tersebut. Variabel `final_val` dideklarasikan secara _immutable_, lalu langsung diinisialisasi ketika loop selesai. Dengan begitu, tidak lagi memerlukan tipe pembungkus (seperti `Option`) maupun memanggil `unwrap()` yang berpotensi menimbulkan masalah.

## Tanya Jawab

### Apakah while dan for loop juga dapat mengembalikan nilai menggunakan break?

Tidak, hanya konstruksi `loop` tanpa kondisi yang dapat mengembalikan nilai. Hal ini karena compiler tidak dapat menjamin bahwa `for` atau `while` loop akan menjalankan ekspresi break-nya. Ketika loop kondisional tersebut berakhir secara normal tanpa break, nilai yang dihasilkan selalu berupa tipe unit `()`.

### Apakah bisa mengembalikan nilai dari nested loop menggunakan label?

Ya, dengan mengarahkan break ke loop luar yang memiliki label dengan menuliskan label tersebut sebelum nilai yang ingin dikembalikan, seperti `break 'search item;`. Dengan cara ini, memungkinkan untuk keluar dari nested blok dan langsung meneruskan hasil perhitungan ke variabel yang menampung nilai tersebut.

### Apa tipe hasil evaluasi dari infinite loop yang tidak menjalankan break?

Infinite loop yang tidak memiliki `break` akan menghasilkan _never type_ `!`. Karena alur eksekusi tidak pernah berlanjut melewati loop tersebut, Rust memungkinkan nilai bertipe `!` dikonversi secara implisit (_coercion_) menjadi tipe apapun yang diharapkan, baik dalam _match arm_ maupun sebagai nilai balik sebuah fungsi.
