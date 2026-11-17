---
title: "Safely Convert Between Integer Types"
description: "How to convert signed and unsigned integers without unexpected overflow or panics using Rust's safe conversion methods."
pubDate: 2026-11-17
tags: ["rust", "number-conversions"]
category: "SNIPPET"
no: "17"
lang: "en"
draft: false
---
## TL;DR

Rust lets `as` cast silently wrap on overflow, which silently corrupts data. Use `wrapping`, `saturating`, `checked`, or `containing()` methods instead.

## The wrong way

```rust
fn unsafe_convert(value: i32) -> u32 {
    value as u32  // Oops, panics on negative values!
}
```

**Why it fails:** The plain `as` cast keeps the raw bits without checking sign. Negative `i32` becomes a huge `u32`, silently corrupting data or panic-free on undefined behavior.

## The right way

```rust
fn safe_convert(value: i32) -> u32 {
    value.wrapping_into()  // Returns wrapping value
}

fn safe_convert_sat(value: i8) -> u16 {
    value.saturating_into()  // Clamps to bounds
}
```

**Why it works:** Rust supplies type-aware methods like `wrapping_into()`, `saturating_into()`, `checked_into()`, and `containing()`. These respect bounds, avoiding overflow, preserving sign, and staying safe.

## Q&A

**How do I choose between these methods?**

Use `wrapping` for preserving bit patterns, `saturating` when you want clamped values, and `checked` when you need to handle errors explicitly.

**Can I handle binary bases?**

Yes—use `to_string()` with `base` parameter (e.g., `u32::from_str_radix("FF", 16)`) and parse back using methods like `parse()`.

