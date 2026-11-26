---
title: "Rust iterators: borrow instead of consume"
description: "Use iter() to borrow a Rust collection during iteration, so the collection remains available afterward, into_iter() consumes it and cannot be reused again."
pubDate: 2026-11-26
tags: ["rust", "iterators"]
category: "SNIPPET"
no: "25"
lang: "en"
draft: false
---

## TL;DR

> Borrow with `iter()` when a `for` loop should leave the collection usable, `into_iter()` consumes the collection and moves its ownership.

## The wrong way

Calling `into_iter()` on a `Vec` inside a `for` loop gives the loop ownership of the collection:

```rust
fn main() {
    let names = vec![String::from("Ada"), String::from("Lin")];

    for name in names.into_iter() {
        println!("{name}");
    }

    println!("{} names", names.len());
}
```

This fails to compile because `names` was moved. A `for` loop is sugar for iteration over an `IntoIterator`, for a `Vec`, `into_iter()` consumes the vector and moves its elements out. The final `.len()` therefore tries to borrow a value that no longer exists.

`into_iter()` is useful when ownership should move, but using it as the default makes later access invalid. This failure is especially helpful because it exposes an ownership decision in the loop rather than hiding it behind indexing. The compiler refuses the second use instead of silently duplicating the vector.

## The right way

Borrow the elements with `.iter()` when the loop only needs to inspect them:

```rust
fn main() {
    let names = vec![String::from("Ada"), String::from("Lin")];

    for name in names.iter() {
        println!("{name}");
    }

    println!("{} names", names.len());
}
```

The iterator now yields `&String` values. `names` is only borrowed, so it remains available after the loop and `.len()` works without cloning or moving the strings. The important distinction is ownership: `.iter()` requests shared access, while `.into_iter()` requests ownership.

Neither choice changes how the loop prints each item. The difference is what happens to the container and its elements after iteration, so choose the narrowest access the task requires.

This is the ownership choice shown in the [Iterators section of cheats.rs](https://cheats.rs/#iterators): `into_iter()` consumes a collection, `iter()` borrows it, and `iter_mut()` borrows it mutably. Choose based on what the loop should do with the items. For this read-only pass, shared borrowing is enough.

## Q&A

### When should I use `into_iter()`?

Use it when the loop should own each item and the original collection is no longer needed. Moving values into another collection is a natural fit.

### Does `iter()` clone the elements?

No. `iter()` yields shared references, so it neither clones the elements nor moves them out of the collection. Use `into_iter()` when ownership should move.

### When should I use `iter_mut()`?

Use `iter_mut()` when the loop must modify elements in place. It yields mutable references and still leaves the original collection available afterward.
