---
title: "Lifetimes in Rust: Annotating References in Functions"
description: "Rust requires explicit lifetime annotations when returning references from multiple inputs so the borrow checker can track validity across function scopes."
pubDate: 2026-10-31
tags: ["rust", "memory-&-lifetimes"]
category: "SNIPPET"
no: "06"
lang: "en"
draft: false
---

## TL;DR

Rust cannot infer which reference a function returns when multiple borrowed inputs are passed. Explicit lifetime annotations do not change runtime behavior; they establish a [static contract](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html) so the compiler guarantees returned references never outlive their source data.

## The wrong way

```rust
fn pick_longest(first: &str, second: &str) -> &str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

Under Rust's [_lifetime elision_](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html?highlight=elision#lifetime-elision) rules, each input parameter receives a distinct anonymous lifetime. Because the function could return either `first` or `second`, the compiler cannot determine which parameter's lifetime governs the return type. With ambiguous lifetime bounds, the borrow checker cannot guarantee that the resulting reference will remain valid at call sites. Compilation halts with error `E0106: missing lifetime specifier`.

## The right way

```rust
fn pick_longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    if first.len() >= second.len() {
        first
    } else {
        second
    }
}
```

Introducing the generic lifetime parameter `'a` declares an explicit relationship between the inputs and the output. This contract tells the borrow checker that the returned reference is tied to the intersection of both arguments, surviving only as long as the shorter-lived input. The compiler statically verifies that callers never access the returned slice after either buffer goes out of scope, adding zero runtime overhead.

## Q&A

### Do lifetime annotations change how long a variable lives in memory?
No, lifetime annotations are purely compile-time markers used by the borrow checker. They do not alter allocation scopes, execution order, or object destruction (drop).

### When can function lifetime annotations be safely omitted?
Annotations can be omitted whenever standard lifetime elision rules apply, such as functions taking only one reference parameter or methods borrowing `&self`. In those cases, Rust automatically maps the single input lifetime to the return reference.

### How does the compiler handle two arguments with different scopes?
Rust resolves `'a` to the shorter of the two lifetimes at the call site. The returned reference is therefore restricted to the narrower scope to prevent dangling pointers.
