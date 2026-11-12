---
title: "Vec Allocation: Preallocate with Vec::with_capacity"
description: "Preallocating vector memory with Vec::with_capacity eliminates multiple heap reallocations and memcpy copies during growth when the item count is known ahead."
pubDate: 2026-11-12
tags: ["rust", "performance-tips"]
category: "SNIPPET"
no: "15"
lang: "en"
draft: false
---

## TL;DR
When creating a vector whose final length is known or predictable, initialize it using `Vec::with_capacity` instead of `Vec::new`. Reserving memory upfront eliminates repetitive heap reallocations, avoids allocator lock contention, and prevents redundant memory copies.

## The wrong way
Constructing an empty vector and appending items dynamically in a tight loop forces dynamic heap reallocations. Without an explicit capacity hint, the runtime must continually expand the backing buffer as elements accumulate.

```rust
fn generate_squares(count: usize) -> Vec<usize> {
    let mut numbers = Vec::new();
    for i in 0..count {
        numbers.push(i * i);
    }
    numbers
}
```

`Vec::new()` begins with a capacity of zero, deferring heap allocation until the first push. As items are inserted, the vector exceeds its current capacity, issues a call to allocate a larger buffer (typically doubling in size), and copies all existing elements to the new address before deallocating the old buffer. In performance-critical loops or high-throughput network services, these repeated reallocations fragment heap memory, trigger allocator contention, and waste valuable CPU cycles on memory copies.

## The right way
Explicitly declare your memory requirements upfront during initialization using `Vec::with_capacity` whenever the element count is known or bounded.

```rust
fn generate_squares(count: usize) -> Vec<usize> {
    let mut numbers = Vec::with_capacity(count);
    for i in 0..count {
        numbers.push(i * i);
    }
    numbers
}
```

`Vec::with_capacity(count)` performs a single heap allocation sized to store all expected items from the beginning. Because the backing storage already has enough room, subsequent `push` calls write directly into contiguous memory and increment the length counter. This completely removes reallocation overhead, avoids intermediate memcpy calls, and maintains sequential CPU cache locality with predictable O(1) amortized insertion.

## Q&A

### Does Iterator::collect perform this optimization automatically?
Yes, standard range and slice iterators implement `ExactSizeIterator`, which allows `collect::<Vec<_>>()` to inspect `size_hint()` and reserve the exact capacity automatically.

### What is the performance risk of overestimating capacity?
Overestimating capacity reserves excess heap memory and increases your application's resident memory footprint. You can reclaim unused buffer space later by calling `Vec::shrink_to_fit()` once all items are inserted.

### When is Vec::new still the better choice?
Use `Vec::new()` when vectors frequently remain empty or when early error checks might return before appending items. It creates a lightweight handle without triggering any heap allocations until the first push.
