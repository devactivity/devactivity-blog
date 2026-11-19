---
title: "Prefer Vec over Fixed Size Arrays"
description: "Vec provides dynamic sizing, stack safety, and pattern matching on variants. Box [T] lacks partitioning and heap allocation semantics."
pubDate: 2026-11-19
tags: ["rust", "standard-library-types"]
category: "ARTICLES"
no: "18"
lang: "en"
draft: false
---

## TL;DR

Stack arrays limit memory boundaries. Vec offers adjustable capacity, drop order safety, and idiomatic iteration. Fixed-size slices with Box<[T]> prevent partitioning, drop hazards, and heap allocation clarity.

## The wrong way

```rust
let data = Box<[i32; 4]>;
let slice = &data[..];
match slice {
    [first, .., last] => println!("{} {}", first, last),
    _ => {}
}
```

Fixed-size slices with Box<[T]> structure treat memory as opaque. Partitioning disallowed. Drop ordering ambiguous. No dynamic sizing or capacity tracking.

## The right way

```rust
let mut data = Vec::with_capacity(4);
data.push(1);
data.push(2);
data.push(3);
data.push(4);

if let [first, .., last] = data {
    println!("{} {}", first, last);
}
```

Vec enables dynamic resizing. Pattern matching on partitions safe. Drop order deterministic. Clear stack semantics with heap-allocatable sizing. Capacity tracking built-in.

## Q&A

**When should I use Box<[T]> instead of Vec?**

Use Box<[T]> only for zero-allocated fixed buffers, FFI interop, or when type-level size is required. Prefer Vec for all other cases.

**Can Vec push overflow cause stack overflow?**

No. Vec operations are heap-allocated. Stack overflow occurs only from recursion depth or bounded fixed-size allocations.
