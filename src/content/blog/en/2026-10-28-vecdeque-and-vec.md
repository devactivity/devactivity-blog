---
title: "VecDeque in Rust: Fast FIFO Queues Without Vec Overhead"
description: "Use VecDeque instead of Vec when building FIFO queues in Rust. VecDeque provides O(1) push and pop operations at both ends using an efficient ring buffer."
pubDate: 2026-10-28
tags: ["rust", "data-structures"]
category: "SNIPPET"
no: "04"
lang: "en"
draft: false
---

## TL;DR
Never use `Vec::remove(0)` for FIFO queues in Rust. Because `Vec` keeps contiguous memory, front deletions trigger expensive element shifts with O(n) cost. Use `VecDeque` instead for amortized O(1) enqueue and dequeue operations at both ends.

## The wrong way
Treating standard `Vec` collections as work queues by pulling elements from the front:

```rust
let mut tasks = Vec::new();
tasks.push("task_1");
tasks.push("task_2");
tasks.push("task_3");

let next_task = tasks.remove(0);
assert_eq!(next_task, "task_1");
```

A standard vector maintains a single contiguous block of memory with elements packed side by side. Calling `Vec::remove(0)` forces the standard library to copy every subsequent item in memory one position forward via `ptr::copy`. For a queue processing thousands of events, this turns simple polling into an O(n) operation per item, leading to an overall quadratic O(n^2) processing time and severe throughput degradation under high load.

## The right way
Using `VecDeque` from `std::collections` as a dedicated double-ended queue:

```rust
use std::collections::VecDeque;

let mut tasks = VecDeque::new();
tasks.push_back("task_1");
tasks.push_back("task_2");
tasks.push_back("task_3");

let next_task = tasks.pop_front();
assert_eq!(next_task, Some("task_1"));
```

`VecDeque` implements a growable ring buffer backed by a contiguous heap allocation. Instead of copying items when popping from the front, it simply increments an internal head pointer wrapped by modular arithmetic. Both appending with `push_back` and draining with `pop_front` operate in amortized O(1) time, delivering predictable throughput and minimal CPU overhead regardless of how many pending tasks remain in the buffer.

## Q&A

### When should I prefer Vec over VecDeque?
Choose `Vec` when elements are only added or removed at the end, or when you must pass contiguous slices directly to APIs expecting `&[T]`. Because `VecDeque` wraps around a ring boundary, its items may span two disjoint slices rather than one continuous memory range.

### How does VecDeque handle memory allocation when growing?
`VecDeque` allocates extra heap space using power-of-two capacities and doubles its backing storage whenever the buffer fills. During reallocation, it unrolls the circular buffer into a single contiguous segment so future push and pop operations continue smoothly.

### Can I convert between Vec and VecDeque without performance penalty?
Yes, standard library `From` implementations allow converting between `Vec<T>` and `VecDeque<T>` with zero copying whenever buffer alignment permits. This lets you construct or sort data efficiently as a vector before transforming it into a queue for consumption.
