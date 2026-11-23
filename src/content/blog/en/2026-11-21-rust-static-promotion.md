---
title: "Rust Static Promotion: How a Temporary Reference Becomes 'static"
description: "See how Rust’s rvalue static promotion turns `&42` into a `&'static i32`, why a borrowed local fails, and which pattern to choose for safe, readable code."
pubDate: 2026-11-21
tags: ["rust", "language-sugar"]
category: "SNIPPET"
no: "20"
lang: "en"
draft: false
---

## TL;DR

Rust promotes eligible constant rvalues such as `&42` to `'static` references. It cannot extend a local variable's lifetime, so returning `&n` fails, return the literal directly or keep the value alive in the caller.

## The wrong way

```rust
fn static_number() -> &'static i32 {
    let n = 42;
    &n
}
```

This looks equivalent, but `n` is a local binding. Returning `&n` would let the caller observe a value after the function's local storage has ended, so Rust rejects the borrow with a “borrowed value does not live long enough” error. The lifetime in the signature is a promise to the compiler, not a command to keep locals alive.

The same rule applies when the value is only borrowed locally:

```rust
let n = 42;
let x = &n;
```

Here `x` is valid while `n` remains alive in the enclosing scope, but it is not a `'static` reference. The shorthand `&n` is borrowing sugar over a place expression, it does not create an immortal copy.

## The right way

```rust
fn static_number() -> &'static i32 {
    &42
}
```

This compiles because `42` is an eligible constant rvalue. Rust's rvalue static promotion gives the literal static storage, so `&42` has type `&'static i32` and remains valid after the function returns. The compiler performs this promotion automatically, no explicit `static` item or unsafe code is needed.

The important distinction is between creating a reference to an existing local and referring to a promotable constant. Use a direct literal for the latter. If the value is dynamic, keep it in a caller-owned variable and borrow it there, or return an owned value. This makes the lifetime relationship visible instead of relying on a hidden promotion that only applies to a limited set of expressions.

Promotion is deliberately conservative. It does not promote arbitrary runtime results, local variables, or values whose types do not satisfy the promotion rules. Those restrictions keep the `'static` promise meaningful: the referent must genuinely be valid for the program lifetime, not merely convenient to name in a short snippet.

## Q&A

### Does every `&42` become `'static`?

Only eligible constant rvalues are promoted. A reference to a local variable remains tied to that local's lifetime, while a literal expression such as `&42` can be promoted.

### Why not use `Box::leak` or an explicit `static`?

Those tools solve different problems: `Box::leak` deliberately sacrifices cleanup, while a named `static` needs a fixed value. Direct literal promotion is simpler when the expression qualifies.

### Is this only for integers?

No. Promotion can apply to other eligible constant expressions, but not every expression qualifies. A local, function result, or value computed at runtime cannot be promoted.
