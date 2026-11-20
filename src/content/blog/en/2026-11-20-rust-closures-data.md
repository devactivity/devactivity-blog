---
title: "Closures capture variables differently than functions"
description: "Learn how closures can capture by value, reference, or mutable reference using different syntax"
pubDate: 2026-11-20
tags: ["rust", "closures"]
category: "SNIPPET"
no: "19"
lang: "en"
draft: false
---

## TL;DR

Closures capture variables from their scope. Using `[|x| x * 2]` captures by value, `[&mut y| y += 1]` captures mutably, `[&x| x]` captures by reference.

## The wrong way

```rust
let data = 5;
let square = |x| x * data; // Error: `data` does not move into closure
```

Why it fails: The closure `|x| x * data` has an _unannotated_ parameter `x`, and nothing in the code tells the compiler its type, so it reports `E0282: type annotations needed`. The captured variable data is not the issue: closures can read variables from their surrounding scope, and Rust _infers_ how to capture them (here, by _shared reference_). The error goes away once the type is determined, either by annotating it (`|x: i32|`) or by calling the closure (`square(2)`), which lets the compiler _infer_ `x` from that use.

## The right way

```rust
let data = 5;
let square = |x| x * data;
assert_eq!(square(2), 10);
```

Why it works: The call `square(2)` gives the compiler the information it was missing: `x` must be an integer, so it is inferred as `i32` (the default integer type), and the closure gets the signature `Fn(i32) -> i32`. Separately, the closure reads `data` from its surrounding scope. Because the body only reads it, Rust automatically captures it by _shared reference_, so `data` stays accessible inside the closure body. Capture mode is inferred from how the body uses each variable, not chosen by a default setting.

## Q&A

**What capture modes exist?**

- `[|x| ...]` captures by value (moves data)
- `[&mut x| ...]` captures mutably (allows modification)
- `[&x| ...]` captures by immutable reference (read-only)

**How do closures differ from functions?**

Closures have optional capture rules allowing direct access to surrounding variables. Functions can't capture anything, they require explicit parameters.

**Can closures change captured data?**

Only when captured mutably with `[&mut x]`. Regular capture allows reading but not modifying.
