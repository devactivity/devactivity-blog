---
title: "Type Conversions in Rust: Implement From, Not Into"
description: "Implement the From trait instead of Into for infallible Rust type conversions to get the reciprocal Into implementation and standard library support for free."
pubDate: 2026-11-11
tags: ["rust", "type-conversions"]
category: "SNIPPET"
no: "14"
lang: "en"
draft: false
---

## TL;DR
Always implement `From` rather than `Into` for infallible type conversions. Rust provides a blanket implementation of `Into` for any type that implements `From`, unlocking both explicit constructor syntax and generic method chaining without duplicating boilerplate.

## The wrong way
```rust
struct UserId(u64);

// Implementing Into directly for a custom type
impl Into<UserId> for u64 {
    fn into(self) -> UserId {
        UserId(self)
    }
}

fn main() {
    let id: UserId = 42u64.into();
    // Fails to compile: UserId::from(42u64) is not implemented!
    // let id2 = UserId::from(42u64);
}
```
Implementing `Into` directly satisfies `.into()` calls, but fails to provide the reverse `From` implementation. The Rust standard library has a one-way blanket implementation: `From` implies `Into`, but `Into` never implies `From`. Writing `Into` manually prevents consumers from using `UserId::from(...)` as a readable constructor. Consequently, callers writing generic functions with `T: From<U>` bounds cannot use your type, breaking idiomatic Rust conventions and forcing downstream code into clumsy workarounds.

## The right way
```rust
struct UserId(u64);

// Implement From instead of Into
impl From<u64> for UserId {
    fn from(value: u64) -> Self {
        UserId(value)
    }
}

fn main() {
    // Both conversion styles work seamlessly
    let id1 = UserId::from(42u64);
    let id2: UserId = 42u64.into();
}
```
Implementing `From` automatically generates the reciprocal `Into` implementation via the standard library's blanket rule: `impl<T, U> Into<U> for T where U: From<T>`. This symmetrical design enables both explicit type-directed creation via `UserId::from(...)` and fluent method chaining via `value.into()`. Because `Into` is derived automatically, you never have to choose between functional chaining and constructor calls; users get both idioms effortlessly while retaining standard library compatibility.

## Q&A
### When should I implement Into directly?
Only in rare edge cases involving foreign types where the orphan rule prevents implementing `From`. In practice, nearly all custom, infallible conversions within your crate or between local types should implement `From`.

### What if the conversion can fail at runtime?
Implement `TryFrom` instead of `From` to return a `Result<T, Error>`. The standard library similarly generates a blanket implementation of `TryInto` whenever `TryFrom` is implemented.

### How do From and AsRef differ in purpose?
`From` performs an owned, value-to-value consumption that can transform data structures. `AsRef` provides a cheap, borrowed reference-to-reference conversion without allocating or consuming ownership of the underlying data.
