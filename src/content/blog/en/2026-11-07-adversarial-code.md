---
title: "Adversarial Code in Rust: Defending Unsafe Blocks"
description: "Safe traits can panic or mutate state mid-execution. Never rely on safe trait behavior for memory safety inside unsafe Rust blocks use guards to stay sound."
pubDate: 2026-11-07
tags: ["rust", "adversarial-code"]
category: "SNIPPET"
no: "11"
lang: "en"
draft: false
---

## TL;DR

Safe traits like `Clone` can panic, loop infinitely, or re-enter your structures. Unsafe code must maintain its own safety invariants across arbitrary safe calls never trust safe trait implementations to be pure or well-behaved.

## The wrong way

Unsafe code often breaks when it assumes that safe trait methods will never panic or alter external state:

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

Setting `vec.set_len` before initializing every element assumes `item.clone()` will run to completion. If an adversarial implementation panics on the second iteration, stack unwinding drops `vec`, causing its destructor to read uninitialized memory past index zero and triggering undefined behavior.

## The right way

Always isolate untrusted trait execution from uninitialized memory, updating structural state only after operations succeed:

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

Evaluating `item.clone()` prior to writing to raw memory guarantees that a panic unwinds safely. At every suspension point, `vec` contains only valid, initialized items, preventing drop-related undefined behavior even if `clone()` panics maliciously.

## Q&A

### Can safe code trigger undefined behavior on its own?
No, safe code cannot trigger undefined behavior without an existing flaw in an `unsafe` block. Adversarial implementations simply expose assumptions that unsafe code was never allowed to rely upon.

### Why are traits like Clone or Ord not marked unsafe?
Marking everyday traits with `unsafe impl` would severely harm ergonomics across the Rust ecosystem. The language explicitly places the burden on `unsafe` authors to handle hostile or non-standard trait implementations safely.

### How should unsafe blocks handle potential panics during bulk operations?
Use dedicated drop guards or increment data structure lengths element-by-element as each item is initialized. This guarantees that unwinding drops only initialized elements and frees uninitialized storage without reading it.
