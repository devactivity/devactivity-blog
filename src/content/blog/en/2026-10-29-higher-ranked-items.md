---
title: "Higher-Ranked Trait Bounds: Using for<'a> in Rust"
description: "Higher-ranked trait bounds (HRTBs) use for<'a> to declare lifetimes valid for any duration, letting closures borrow local data created inside a function."
pubDate: 2026-10-29
tags: ["rust", "higher-ranked-items"]
category: "SNIPPET"
no: "05"
lang: "en"
draft: false
---

## TL;DR

Higher-ranked trait bounds (`for<'a>`) allow functions to accept closures that work with references of *any* lifetime. Use HRTBs whenever a closure must borrow short-lived values created inside your function instead of caller-provided references.

## The wrong way

Placing a lifetime parameter directly on a generic function allows the caller to decide the lifetime. This causes compilation errors whenever you attempt to pass a reference to locally allocated data:

```rust
fn inspect_data<'a, F>(f: F)
where
    F: Fn(&'a str),
{
    let local = String::from("temporary");
    f(&local);
}
```

This code fails with a compilation error: `local does not live long enough`. Because `'a` is declared on `inspect_data`, the caller chooses `'a` before entering the function, requiring the reference to outlive the function's execution frame. The local string `local` is allocated on the stack and dropped at the end of the block, meaning its lifetime cannot satisfy a caller-controlled lifetime `'a`.

## The right way

Use higher-ranked trait bounds with `for<'a>` to state that the closure can accept a reference with *any* possible lifetime, including the short duration of a local stack variable:

```rust
fn inspect_data<F>(f: F)
where
    F: for<'a> Fn(&'a str),
{
    let local = String::from("temporary");
    f(&local);
}

fn main() {
    inspect_data(|text| println!("{text}"));
}
```

With `for<'a>`, the [universal quantifier](https://doc.rust-lang.org/stable/reference/trait-bounds.html?utm_source=chatgpt.com#higher-ranked-trait-bounds) binds the lifetime directly to the trait bound rather than the outer function. The closure promises that it can handle references of any lifetime the callee provides. Now `inspect_data` can allocate data internally, borrow it briefly for the duration of the call to `f`, and deallocate it safely when the scope ends.

```bash
|       Call          |     Caller     |    Callee      |
| ------------------- | -------------- | -------------- |
| `inspect_data(...)` | `main()`       | `inspect_data` |
| `f(&local)`         | `inspect_data` | The closure    |
```

## Q&A

### Can the for<'a> syntax be omitted for closures?
Yes. Rust's lifetime elision rules automatically desugar closure trait bounds like `F: Fn(&str)` into `F: for<'a> Fn(&'a str)`.

### When is explicit for<'a> syntax strictly required?
Explicit `for<'a>` is necessary when expressing complex relationships between lifetimes, such as binding an input lifetime to an output reference via `F: for<'a> Fn(&'a str) -> &'a str`.

### Do higher-ranked trait bounds add runtime overhead?
No. Higher-ranked trait bounds are validated strictly at compile time by the borrow checker and produce zero runtime overhead or heap indirection.
