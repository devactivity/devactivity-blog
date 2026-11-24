---
title: "Rust API Stability: Evolve Enums Without Breaking Clients"
description: "Rust API stability: mark public enums `#[non_exhaustive]` so adding variants stays source-compatible, while downstream matches keep a proper wildcard arm."
pubDate: 2026-11-24
tags: ["rust", "api-stability"]
category: "SNIPPET"
no: "23"
lang: "en"
draft: false
---

## TL;DR

> Make public enums `#[non_exhaustive]`: require downstream wildcard arms, then add variants without breaking compilation.

## The wrong way

API stability starts with deciding which future changes consumers can absorb. For an enum, an exhaustive match is a promise that the set of variants is closed. Here is a small library API and the client it invites:

```rust
pub enum Mode {
    Fast,
    Precise,
}
```

```rust
match mode {
    Mode::Fast => run_fast(),
    Mode::Precise => run_precise(),
}
```

That client compiles today. The problem appears when the library adds `Mode::Balanced`, the client’s match has no arm for the new variant, so upgrading breaks compilation. Renaming or removing variants would be breaking too. In other words, a publicly exposed enum without a forward-compatibility marker turns every future variant into a major-version decision.

## The right way

Declare the enum non-exhaustive before release, and make clients acknowledge that more variants may arrive:

```rust
#[non_exhaustive]
pub enum Mode {
    Fast,
    Precise,
}
```

```rust
match mode {
    Mode::Fast => run_fast(),
    Mode::Precise => run_precise(),
    _ => fallback(),
}
```

In the cheats.rs API Stability section, adding a variant to a public enum is a breaking change unless the enum is marked `#[non_exhaustive]`. The attribute is the targeted mitigation, it turns exhaustiveness into an explicit contract that downstream code must tolerate unknown variants.

The attribute changes the contract, downstream crates must include a catch-all arm, while the defining crate can add variants later without making those matches fail to compile. The wildcard is not an invitation to silently mishandle new states, it is a place to choose a deliberate fallback or error. This is one targeted API-stability measure, not a guarantee that behavior is unchanged. If `Balanced` changes semantics, document it, test it, and assess whether the release remains compatible.

## Q&A

### Does `#[non_exhaustive]` let me add enum variants later?

Yes. It permits adding variants without breaking downstream matches, provided the library used the attribute from the start and consumers include a catch-all arm.

### Can downstream code still match every known variant?

It can, but the catch-all arm remains mandatory. The compiler forces downstream code to account for future variants instead of assuming the current list is complete.

### Is every enum change safe after adding the attribute?

No. Variant additions become source-compatible, but behavior changes, changed field types, or altered semantics can still break clients. Review each change against semantic versioning.
