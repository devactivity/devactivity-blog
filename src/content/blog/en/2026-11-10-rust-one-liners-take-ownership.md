---
title: "Rust One-Liners: Take Ownership with std::mem::take"
description: "Extract ownership from a mutable borrow without cloning by using std::mem::take to swap in the default value, avoiding heap allocations in hot Rust loops."
pubDate: 2026-11-10
tags: ["rust", "one-liners"]
category: "SNIPPET"
no: "13"
lang: "en"
draft: false
---

## TL;DR

Use `std::mem::take` to extract owned values behind mutable references without cloning. It swaps the target with its type's `Default` in place, avoiding heap allocations while satisfying Rust's borrow checker in a single idiomatic line.

## The wrong way

```rust
struct Worker {
    buffer: Vec<String>,
}

impl Worker {
    fn flush(&mut self) -> Vec<String> {
        let data = self.buffer.clone();
        self.buffer.clear();
        data
    }
}
```

Developers frequently clone container fields when extracting owned data out of a mutable struct reference. If you remove `.clone()`, rustc immediately triggers error `E0507: cannot move out of self.buffer which is behind a mutable reference`. The compiler enforces this invariant because moving the vector out would leave `self.buffer` uninitialized if a panic occurs. To silence the error, developers allocate duplicate heap memory for every single string and clear the original vector immediately after. This defensive copy introduces unnecessary heap churn, degrades runtime performance in tight loops, and clutters the method with boilerplate cleanup.

## The right way

```rust
use std::mem;

struct Worker {
    buffer: Vec<String>,
}

impl Worker {
    fn flush(&mut self) -> Vec<String> {
        mem::take(&mut self.buffer)
    }
}
```

The `std::mem::take` function replaces `self.buffer` with an empty vector using `Default::default()` and returns the original buffer with full ownership. Because `Vec::default()` does not allocate heap memory, the swap executes instantaneously as an efficient pointer exchange in stack memory. The borrow checker is satisfied because `self.buffer` remains completely valid and initialized throughout the transition. By replacing verbose cloning with a single idiomatic call, you eliminate wasteful heap allocations, prevent memory leaks, and express exact ownership transfer semantics.

## Q&A

### What trait must the target type implement for std::mem::take?
The target type must implement `Default` so Rust can replace the value in place. For types without `Default`, use `std::mem::replace` to specify an explicit replacement value instead.

### How does std::mem::take differ from std::mem::replace?
`take(&mut x)` is an ergonomic shorthand for `replace(&mut x, Default::default())`. Both perform the same underlying pointer swap, but `take` requires fewer arguments when a default instance exists.

### Does std::mem::take allocate new heap memory?
For standard collection types like `Vec`, `String`, or `Option`, `Default::default()` creates empty representations without any heap allocation. This makes `mem::take` a zero-cost memory move at runtime.
