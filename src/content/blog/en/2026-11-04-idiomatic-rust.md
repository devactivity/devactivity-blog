---
title: "Idiomatic Rust: Pass &str Instead of &String"
description: "Accept &str instead of &String in Rust function arguments to allow callers to pass string literals, slices, and owned Strings without heap allocations."
pubDate: 2026-11-04
tags: ["rust", "idiomatic-rust"]
category: "SNIPPET"
no: "09"
lang: "en"
draft: false
---

## TL;DR

Never accept `&String` as a read-only function parameter in Rust. Accept `&str` instead thanks to deref coercion, `&str` handles string slices, string literals, and owned `String` references cleanly without forcing unnecessary heap allocations.

## The wrong way

```rust
fn count_words(text: &String) -> usize {
    text.split_whitespace().count()
}

fn main() {
    let greeting = "hello world";
    let count = count_words(&greeting.to_string());
    println!("Word count: {count}");
}
```

Demanding a borrowed `&String` restricts the caller to an exact pointer to a heap-allocated buffer. When a caller holds a string literal or an existing substring slice (`&str`), Rust cannot coerce `&str` into `&String`. Callers must allocate a brand-new `String` on the heap via `.to_string()` or `.to_owned()` solely to satisfy the parameter type. This pattern wastes memory, degrades runtime performance, and makes your public API unnecessarily rigid and painful to consume.

## The right way

```rust
fn count_words(text: &str) -> usize {
    text.split_whitespace().count()
}

fn main() {
    let literal: &str = "hello world";
    let owned: String = String::from("idiomatic rust patterns");

    let c1 = count_words(literal);
    let c2 = count_words(&owned);

    println!("Counts: {c1}, {c2}");
}
```

`&str` is an unowned string slice, a fat pointer containing a memory address and a length. By accepting `&str`, your function becomes agnostic to how or where the underlying bytes are stored. It works natively with string literals in static memory, sub-slices of existing buffers, and owned `String` instances. Because `String` implements `Deref<Target = str>`, passing `&owned` automatically coerces to `&str` at compile time with zero runtime overhead and zero heap allocations. This simple habit maximizes API ergonomics while preserving optimal performance.

## Q&A

### Does this principle apply to collections like Vec<T>?
Yes, the exact same logic applies across the standard library. Functions should accept slice references `&[T]` rather than `&Vec<T>`, enabling callers to pass fixed-size stack arrays, sub-slices, and heap vectors interchangeably.

### When should a function accept &String?
Virtually never for read-only access. If your function only reads text, use `&str` if it needs to mutate the string in place, accept a mutable reference `&mut String` instead.

### What if a function needs an owned copy?
Accept `String` directly by value or use `impl Into<String>`. This allows callers who already own a `String` to transfer ownership without triggering an extra allocation, while callers with `&str` can explicitly pass a clone.
