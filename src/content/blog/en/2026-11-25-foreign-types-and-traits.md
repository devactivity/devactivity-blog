---
title: "Rust Foreign Types and Traits: The Orphan Rule"
description: "Learn Rust's orphan rule: implement a local trait for a foreign type, then use a newtype when you need a foreign trait for your own local type without hacks"
pubDate: 2026-11-25
tags: ["rust", "foreign-types-and-traits"]
category: "SNIPPET"
no: "24"
lang: "en"
draft: false
---

## TL;DR

Rust’s orphan rule lets you implement a local trait for a foreign type. If the trait is foreign, define a local wrapper and implement it for that wrapper instead.

## The wrong way

Start with a familiar desire: make `Vec<u8>` printable with `{}` without manually formatting it. The obvious implementation tries to add `Display` behavior to a type your crate does not own:

```rust
impl std::fmt::Display for Vec<u8> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
```

This fails with orphan-rule error E0117. Both `std::fmt::Display` and `Vec` are foreign to your crate. Rust will not let one crate add behavior to another crate’s trait for another crate’s type, because independently developed crates could create conflicting implementations.

"Foreign" does not make a type unusable, it tells you who controls the implementation.

## The right way

The simplest legal move is to make the trait local. Then a foreign type can implement your behavior:

```rust
trait Summary {
    fn summary(&self) -> &str;
}

impl Summary for String {
    fn summary(&self) -> &str {
        self.lines().next().unwrap_or("")
    }
}

fn main() {
    let text = "Rust\nNotes".to_owned();
    println!("{}", text.summary());
}
```

Here `Summary` is local, so implementing it for `String` is allowed. You have added an API around `String`, not changed `String` itself. Other crates can add different traits to `String` without conflicting with this implementation.

The same reasoning applies when the trait is foreign. Instead of implementing `Display` for `String`, create a local wrapper and implement `Display` for the wrapper. The wrapper is the local type that satisfies the orphan rule.

Treat the rule as a design guide: decide whether your abstraction owns the behavior, a local trait, or needs to plug into an existing standard interface, a local newtype plus a foreign trait.

## Q&A

### What exactly counts as foreign?

Anything defined outside the current crate is foreign. `String`, `Vec`, and `Display` are foreign to an application crate, a trait or struct declared in that crate is local.

### Can a foreign trait ever work with a foreign type?

Not through a plain `impl` in your crate: the orphan rule rejects the case where both the trait and receiver type are foreign. Generic implementations can sometimes qualify when they include a permitted local type.

### Why use a newtype instead of extending `String` directly?

A newtype gives you a local type on which to implement the foreign trait. It also lets you control conversions, so you do not accidentally promise behavior for every `String`.
