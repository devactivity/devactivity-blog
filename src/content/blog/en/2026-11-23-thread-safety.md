---
title: "Rust Thread Safety: Share Mutable State with Arc<Mutex<T>>"
description: "Share mutable state across Rust threads with Arc<Mutex<T>>, or choose immutable Arc<T> data when synchronization is unnecessary and avoid locks when possible."
pubDate: 2026-11-23
tags: ["rust", "thread-safety"]
category: "SNIPPET"
no: "22"
lang: "en"
draft: false
---
## TL;DR

Use `Arc<Mutex<T>>` to share owned mutable state between Rust threads. If the data is immutable, share `Arc<T>` instead and skip the lock.

## The wrong way

The [cheats.rs Thread Safety section](https://cheats.rs/#thread-safety) separates shared ownership from synchronized access. A shared pointer is not enough. `Arc` can share ownership, but `RefCell` provides only single-threaded interior mutability. Moving this value into a thread fails to compile:

```rust
use std::{cell::RefCell, sync::Arc, thread};

let data = Arc::new(RefCell::new(Vec::<u8>::new()));
thread::spawn(move || data.borrow_mut().push(1)).join().unwrap();
```

The problem is `RefCell<T>` is not `Sync`. Therefore, `Arc<RefCell<T>>` cannot be sent to another thread safely: `RefCell` does not coordinate concurrent borrows or mutations. The compiler is right to reject this. Replacing `RefCell` with `Mutex` adds the synchronization contract the thread needs.

`RefCell` checks borrows at runtime for local, single-threaded use. Its borrow flag does not coordinate access between threads, and wrapping the value in `Arc` does not change that guarantee.

## The right way

Wrap the mutable data in `Mutex`, then share it with `Arc`. Clone the handle for the worker and lock only while changing the value:

```rust
use std::{sync::{Arc, Mutex}, thread};

let data = Arc::new(Mutex::new(Vec::<u8>::new()));
let worker = Arc::clone(&data);
thread::spawn(move || worker.lock().unwrap().push(1)).join().unwrap();
```

Now `Arc` provides shared ownership, while `Mutex` allows only one thread at a time to hold mutable access. The guard returned by `lock()` keeps the borrow scoped to the critical section and releases the lock when dropped. Here, `Vec<u8>` is `Send`, and `Mutex<Vec<u8>>` is `Sync`, so the shared handle can cross the thread boundary.

`Arc` should be understood as shared ownership, not shared access. Its atomic reference count keeps the allocation alive, but it does not protect the contents of a `Mutex`. Put differently, `Arc` solves lifetime and ownership, `Mutex` solves mutual exclusion.

Keep the critical section short. Doing unrelated work while holding the guard can block every other thread that needs the same data. If nothing mutates the value, omit the `Mutex` and use `Arc<Vec<u8>>`, immutable `Sync` data needs no lock.

## Q&A

### Does `Arc` make `RefCell` thread-safe?

`Arc` does not make `RefCell` thread-safe, it only enables shared ownership and safe reference-count updates. Shared mutation still needs synchronization such as `Mutex` because `RefCell` does not coordinate concurrent borrows across threads.

### What do `Send` and `Sync` mean?

`Send` means ownership can move to another thread, `Sync` means `&T` can be shared across threads. `Arc<Mutex<Vec<u8>>>` crosses the boundary because the inner `Mutex` makes access synchronized.

### Why clone the `Arc` before spawning?

Each thread needs an owned handle to the same allocation. `Arc::clone` increments the reference count without cloning the `Vec`, and the allocation stays alive until the final handle is dropped.
