---
title: "Cross-Compilation di Rust: Konfigurasi Linker Target"
description: "Cross-compiling untuk Rust membutuhkan penambahan target via rustup dan mendefinisikan cross-linker khusus di konfigurasi Cargo untuk mencegah kegagalan."
pubDate: 2026-11-01
tags: ["rust", "cross-compilation"]
category: "SNIPPET"
no: "07"
lang: "id"
draft: false
---

## TL;DR

`rustup target add` mengunduh artefak standard library, bukan cross-linker. Cross-compilation haruslah mengarahkan Cargo ke linker arsitektur spesifik melalui konfigurasi, jika tidak, proses build akan gagal saat penautan (linking).

## Cara yang salah

```bash
rustup target add aarch64-unknown-linux-gnu
cargo build --target aarch64-unknown-linux-gnu
```

Menjalankan `cargo build` secara langsung setelah menambahkan [target triple](https://doc.rust-lang.org/rustc/platform-support.html) untuk platform lain umumnya akann menyebabkan kegagalan build pada tahap linking akhir. Meskipun `rustup target add` berhasil mengunduh standard lib Rust (`libstd`) yang telah d-compile sebelumnya untuk arsitektur target, perintah tersebut tidak menyediakan runtime C atau toolchain linker yang diperlukan oleh platform tersebut.

Secara default, Cargo memanggil compiler C di host-machine (`cc` atau `ld`) untuk menautkan berkas objek dari platform target. Karena linker host tidak dapat mengenali arsitektur kode mesin atau relokasi yang berasal dari platform berbeda, proses compile akan langsung terhenti dengan pesan error seperti `linker 'cc' failed: exit status 1` atau pesan yang menunjukkan adanya flag emulasi yang tidak dikenali.

## Cara yang benar

```toml
# .cargo/config.toml
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc"
```

```bash
sudo apt-get install -y gcc-aarch64-linux-gnu
cargo build --target aarch64-unknown-linux-gnu
```

Agar proses cross-compile berhasil, maka harus memasang toolchain cross-compiler yang sesuai pada sistem host-machine dan mendaftarkannya di dalam `.cargo/config.toml`. Tabel `[target.<triple>]` memberi tahu Cargo secara spesifik binary linker mana yang harus digunakan saat menghasilkan artefak akhir.

Dengan adanya konfigurasi ini, rustc menghasilkan instruksi mesin untuk platform target, sedangkan Cargo mendelegasikan proses perakitan (assembly) serta linking ke `aarch64-linux-gnu-gcc`. Cross-linker kemudian menyelesaikan simbol, header, dan dynamic runtime binding yang sesuai dengan arsitektur target secara akurat, sehingga menghasilkan binary yang sepenuhnya kompatibel untuk sistem tujuan.

## Tanya Jawab

### Mengapa rustup tidak menyertakan cross-linker?
Rustup hanya mengelola compiler Rust, standard library utama, dan komponen toolchain bawaan Rust. Karena linker sangat bergantung pada standard library C yang spesifik untuk vendor serta toolchain sistem untuk proses compile dari host ke target, developer harus memasangnya melalui package manager sistem.

### Kapan sebaiknya menargetkan musl daripada gnu?
Menargetkan `x86_64-unknown-linux-musl` memungkinkan seluruh dependensi dan fungsi rutin libc disertakan secara statis langsung ke dalam hasil executable. Dengan demikian, aplikasi tidak lagi bergantung pada versi glibc tertentu saat dijalankan, sehingga proses deployment ke berbagai lingkungan Linux lebih mudah dan portabel.

### Apa peran tool cross?
Utilitas `cross` berfungsi sebagai pengganti langsung Cargo yang dapat digunakan secara langsung dengan menajalankan proses build di dalam kontainer Docker yang telah disiapkan sebelumnya. Tool ini sudah menyediakan linker, library C, dan toolchain cross-compile yang diperlukan, sehingga developer tidak perlu melakukan konfigurasi environment secara manual di mesin lokal.
