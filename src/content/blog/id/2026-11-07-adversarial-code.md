---
title: "Kode Adversarial di Rust: Mengamankan Blok Unsafe"
description: "Trait yang aman (safe trait) tetap dapat menyebabkan panic atau mengubah state saat kode dijalankan. Karena itu, jangan mengandalkan safe trait untuk menjamin keamanan memori di dalam blok unsafe Rust, gunakan guard agar tetap sound (terjamin keamanannya)."
pubDate: 2026-11-07
tags: ["rust", "adversarial-code"]
category: "SNIPPET"
no: "11"
lang: "id"
draft: false
---

## TL;DR

Safe trait seperti `Clone` dapat menyebabkan panic, mengalami infinite loop , atau melakukan re-entrancy (pemanggilan ulang sebelum eksekusi sebelumnya selesai) ke dalam struktur data. Kode unsafe harus tetap menjaga invariant keamanannya sendiri, bahkan ketika melakukan pemanggilan kode aman yang behaviour-nya tidak dapat diprediksi. Jangan pernah menganggap implementasi safe trait selalu murni aman atau menghasilkan output yang sesuai diharapkan.

## Cara yang salah

unsafe code sering kali menjadi tidak sound karena mengasumsikan bahwa metode dari safe trait tidak akan pernah menyebabkan panic atau mengubah state eksternal:

```rust
pub fn duplicate_slice<T: Clone>(src: &[T]) -> Vec<T> {
    let mut vec = Vec::with_capacity(src.len());
    unsafe {
        vec.set_len(src.len());
        for (i, item) in src.iter().enumerate() {
            std::ptr::write(vec.as_mut_ptr().add(i), item.clone());
        }
    }
    vec
}
```

Mengatur `vec.set_len` sebelum semua elemennya selesai diinisialisasi berarti mengasumsikan bahwa `item.clone()` akan selalu selesai tanpa mengalami panic. Jika terdapat implementasi yang berperilaku tidak semestinya (_adversarial implementation_) dan menyebabkan panic pada iterasi kedua, proses _stack unwinding) akan membuat `vec` di-drop. Akibatnya, destruktor `vec` akan mencoba membaca memori yang belum diinisialisasi pada elemen-elemen setelah indeks nol, sehingga memicu _undefined behavior_.

## Cara yang benar

Selalu pisahkan (_isolate_) eksekusi _untrusted trait_ dari memori yang belum diinisialisasi. Perbarui state struktural hanya setelah operasi berhasildiselesaikan:

```rust
pub fn duplicate_slice<T: Clone>(src: &[T]) -> Vec<T> {
    let mut vec = Vec::with_capacity(src.len());
    for item in src {
        let cloned = item.clone();
        unsafe {
            let len = vec.len();
            std::ptr::write(vec.as_mut_ptr().add(len), cloned);
            vec.set_len(len + 1);
        }
    }
    vec
}
```

Mengevaluasi `item.clone()` sebelum menulis hasilnya ke _raw memory_ memastikan bahwa jika terjadi panic, proses _stack unwinding_ tetap berlangsung dengan aman. Pada setiap titik ketika eksekusi terhenti sementara, `vec` hanya berisi elemen valid yang telah diinisialisasi. Dengan demikian, _undefined behavior) yang berkaitan dengan proses _drop_ dapat dihindari, bahkan jika `clone()` sengaja menyebabkan panic.

## Tanya Jawab

### Bisakah safe code memicu undefined behavior dengan sendirinya?
Tidak, safe code tidak dapat memicu _undefined behavior_ tanpa adanya celah yang sudah ada di dalam blok `unsafe`. Implementasi adversarial hanya mengungkap asumsi-asumsi yang sejak awal tidak boleh dijadikan sandaran oleh _unsafe code_.

### Mengapa trait seperti Clone atau Ord tidak ditandai sebagai unsafe?
Menandai trait yang umum digunakan sebagai `unsafe impl` akan sangat mengurangi kemudahan penggunaanya di seluruh ekosistem Rust. Bahasa ini secara eksplisit membebankan tanggung jawab kepada penulis `unsafe` code untuk menangani implementasi trait yang mungkin menyebabkan _undefined behaviour_ ataupun tidak mengikuti pola umum dengan tetap menjaga keamanan kode.

### Bagaimana unsafe block seharusnya menangani potensi panic pada waktu bulk operation?
Gunakan _drop guard_ khusus atau perbarui panjang struktur data secara bertahap, satu elemen demi satu elemen, setiap kali sebuah elemen selesai diinisialisasi. Dengan demikian, ketika terjadi _stack unwinding_, hanya elemen yang sudah diinisialisasi yang akan di-drop, sementara ruang memori yang belum diinisialisasi dapat dibebaskan tanpa perlu dibaca.
