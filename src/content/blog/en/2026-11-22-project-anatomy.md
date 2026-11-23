---
title: "Rust Project Anatomy: Cargo, Modules, and Tests"
description: "Rust's Cargo layout is a set of conventions: entry files define crate roots, mod declarations connect modules, and integration tests see only public APIs."
pubDate: 2026-11-22
tags: ["rust", "project-anatomy"]
category: "SNIPPET"
no: "21"
lang: "en"
draft: false
---

## TL;DR

Cargo does not discover modules from directories. `src/lib.rs` defines the crate root, `mod` makes files reachable, and `tests/` checks the public API. Keep those boundaries explicit.

## The wrong way

Consider a toy library named `greeting` with `src/lib.rs`, `src/format.rs`, and `tests/format.rs`. The formatter exists, but the library root forgets to connect it:

```rust
// src/format.rs
pub fn shout(text: &str) -> String {
    text.to_uppercase()
}
```

```rust
// src/lib.rs
// no `mod format;`
```

Now an integration test tries to use it:

```rust
// tests/format.rs
#[test]
fn shouts() {
    assert_eq!(greeting::shout("hi"), "HI");
}
```

This fails because Cargo does not scan `src/` for arbitrary modules. `src/lib.rs` is the root of the crate's module tree, and `format.rs` is not reachable from it. The integration test is an external-style consumer, so it can only call items the library exposes publicly, `greeting::shout` is not exposed. A file can exist in the right directory and still have no effect on the crate.

## The right way

Declare the module from the root and explicitly re-export the function:

```rust
// src/lib.rs
mod format;

pub use format::shout;
```

The same integration test now works:

```rust
// tests/format.rs
#[test]
fn shouts() {
    assert_eq!(greeting::shout("hi"), "HI");
}
```

`mod format;` tells Rust to load `src/format.rs` as a child module. `pub use format::shout;` creates a public path at the crate root, making `greeting::shout` visible to callers. The important distinction is that Cargo's familiar directories are conventions, while the compiler follows the module tree you declare.

Two separate relationships are therefore in play. The module declaration connects names to files, while visibility controls which names cross the crate boundary. Cargo and the compiler use different rules for each, so a successful build still depends on making the intended path explicit.

For this tiny example, the anatomy is:

```text
greeting/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   └── format.rs
└── tests/
    └── format.rs
```

`Cargo.toml` names the package, `src/lib.rs` starts the library, and `tests/` contains tests that exercise the public surface. The test does not import `format.rs` directly: it imports the crate's public API, just like a downstream user. If a test needs to inspect a private helper, placing it beside the implementation in `src/` makes a unit test a better fit. This separation keeps the library's public contract explicit while still allowing internal details to be tested close to their code.

## Q&A

### Does Cargo automatically include every `.rs` file?

No. Only modules reachable from the crate root through `mod` declarations are compiled as part of that crate, unrelated files can remain unused on disk.

### Where should unit tests live?

Put unit tests next to their implementation in `src/` when they need private items. Put integration tests in `tests/` when they should behave like an external user of the crate.

### Is `src/main.rs` always the entry point?

For a binary package, `cargo run` uses `src/main.rs` by default. A library package normally uses `src/lib.rs` as its crate root, while additional binaries can live in `src/bin/`.
