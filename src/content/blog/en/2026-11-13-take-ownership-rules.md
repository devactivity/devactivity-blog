---
title: "std::mem::take: Moving Values Out of Mutable References"
description: "Use std::mem::take to extract owned data from a mutable reference and replace it with Default. This prevents redundant clones and satisfies the borrow checker."
pubDate: 2026-11-13
tags: ["rust", "miscellaneous"]
category: "SNIPPET"
no: "16"
lang: "en"
draft: false
---

## TL;DR

`std::mem::take` lets you extract owned data from behind a mutable reference by swapping in the type's `Default` value. It eliminates heap allocations from defensive `.clone()` calls without violating Rust's aliasing or move semantics.

## The wrong way

When consuming data stored inside a mutable struct reference, moving a field directly causes a compilation error because Rust cannot leave borrowed memory uninitialized. Developers often silence the compiler by cloning the value:

```rust
struct Buffer {
    items: Vec<String>,
}

impl Buffer {
    fn drain_items(&mut self) -> Vec<String> {
        self.items.clone()
    }
}
```

Direct field moves fail borrow check inspection with errors stating that values cannot move out of borrowed context. While cloning compiles without complaints, it duplicates memory across the heap and introduces unnecessary performance degradation for workloads handling large collections.

## The right way

Call `std::mem::take` to retrieve the owned value while immediately resetting the referenced field to its default value:

```rust
use std::mem;

struct Buffer {
    items: Vec<String>,
}

impl Buffer {
    fn drain_items(&mut self) -> Vec<String> {
        mem::take(&mut self.items)
    }
}
```

`std::mem::take` works on any type that implements `Default`. It atomically swaps `Default::default()` into the target location and transfers ownership of the previous value directly to the caller. Standard library types like `Vec` construct empty allocations without memory overhead, keeping the struct fully initialized and valid at zero runtime cost.

## Q&A

### What is the difference between `std::mem::take` and `std::mem::replace`?
`std::mem::take(&mut x)` is an ergonomic shorthand for `std::mem::replace(&mut x, Default::default())`. Reach for `replace` when you need to substitute a custom instance rather than the default one.

### Does `std::mem::take` allocate when clearing standard collections?
No, default constructors for types like `Vec`, `String`, and `Option` generate empty representations without heap allocations. The swap executes solely via fast stack moves.

### When should you avoid `std::mem::take`?
Avoid it when the underlying type lacks a `Default` implementation, or when an empty state breaks your struct invariants. For those cases, use `std::mem::replace` with a valid, domain-appropriate replacement.
