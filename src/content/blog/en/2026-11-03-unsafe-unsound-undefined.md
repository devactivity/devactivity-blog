---
title: "Unsound Rust: Never Expose Undefined Behavior to Safe Code"
description: "Unsound Rust code allows safe callers to trigger undefined behavior. Encapsulate unsafe blocks with strict invariants so safe callers cannot violate contracts."
pubDate: 2026-11-03
tags: ["rust", "unsafe,-unsound,-undefin"]
category: "SNIPPET"
no: "09"
lang: "en"
draft: false
---

## TL;DR

Code is unsound if safe Rust can trigger undefined behavior through it. An unsafe block is sound only when its enclosing API guarantees all invariants, leaving zero paths for safe callers to break compiler contracts.

- Sound Rust code: Rust code that guarantees memory safety and prevents safe callers from triggering undefined behavior.
- Unsound Rust code: Rust code that allows safe callers to trigger undefined behavior.
- Safe Rust: Rust code that does not explicitly use unsafe operations and is guaranteed to follow Rust's safety rules.
- Unsafe Rust: Rust code that permits certain operations outside the compiler's safety guarantees, making the programmer responsible for upholding the required invariants.
- Invariant: A condition or property that must always hold true for a program to remain correct and safe.


## The wrong way

```rust
pub fn parse_flag(byte: u8) -> bool {
    unsafe { std::mem::transmute(byte) }
}
```

Rust guarantees that a `bool` is represented in memory strictly by byte value `0x00` (`false`) or `0x01` (`true`). Transmuting any other integer such as calling `parse_flag(2)` constructs an invalid value, causing immediate Undefined Behavior. Because `parse_flag` is exposed as a safe function, safe caller code can trigger this violation without ever writing an `unsafe` block. Safe interfaces must never permit Undefined Behavior under any set of safe inputs; failing this rule makes the implementation unsound.

## The right way

```rust
pub fn parse_flag(byte: u8) -> Option<bool> {
    match byte {
        0 => Some(false),
        1 => Some(true),
        _ => None,
    }
}

pub unsafe fn parse_flag_unchecked(byte: u8) -> bool {
    std::mem::transmute(byte)
}
```

The safe `parse_flag` implementation validates the input at runtime, returning `None` for invalid byte values and ensuring that safe callers can never create invalid boolean states. If performance requires skipping runtime validation, the operation must be declared as `unsafe fn parse_flag_unchecked`. Marking the function itself with the `unsafe` keyword shifts the proof obligation to the caller, requiring an explicit `unsafe` block at the call site and documented preconditions stating that `byte` must be either `0` or `1`.

## Q&A

### What is the exact difference between unsafe and unsound?
Unsafe code uses language features that bypass compiler checks, requiring human verification of safety invariants. Unsound code is an implementation defect where an API allows safe code to violate those invariants and trigger undefined behavior.

### Can an unsafe block exist inside a sound safe function?
Yes, this is the foundational pattern of the Rust standard library. An internal `unsafe` block is sound if the enclosing function validates all inputs and guarantees that no safe caller interaction can ever violate the encapsulated safety contracts.

### When should a library author mark a function as unsafe?
Mark a function `unsafe` whenever the function cannot independently guarantee memory safety and must rely on the caller to uphold specific invariants. If the function defends its own invariants completely, it should remain safe.
