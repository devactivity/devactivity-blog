---
title: "Rust cfg_attr: Apply Conditional Attributes Cleanly"
description: "Use Rust's cfg_attr attribute to attach derives and helper traits conditionally. This eliminates duplicated struct declarations across test and prod builds."
pubDate: 2026-11-08
tags: ["rust", "macros-&-attributes"]
category: "ARTICLES"
no: "12"
lang: "en"
draft: false
---

## TL;DR
Stop cloning entire type definitions behind `#[cfg(...)]` flags. Use `#[cfg_attr(predicate, attribute)]` to conditionally apply derives, macros, or compiler directives directly to items without introducing code drift or maintenance debt.

## The wrong way
When a data structure needs special trait implementations during testing such as `Debug`, `Clone`, or `PartialEq` developers often fork the entire declaration using opposing conditional compilation flags.

```rust
#[cfg(test)]
#[derive(Debug, PartialEq, Clone)]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}

#[cfg(not(test))]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}
```

Why it fails:
Duplicating struct declarations violates the single source of truth principle. When fields change, both declarations must be synchronized manually. Missing an edit creates compilation failures that only surface under specific build profiles. In addition, doc comments, field visibility, and existing attributes must be maintained in duplicate, introducing clutter and subtle drift between debug and release binaries.

## The right way
Conditionally attach the desired attributes using `#[cfg_attr]` directly on a single struct definition.

```rust
#[cfg_attr(test, derive(Debug, PartialEq, Clone))]
pub struct Session {
    pub token: String,
    pub user_id: u64,
}
```

Why it works:
The `cfg_attr` attribute accepts a predicate condition followed by one or more attributes to attach when that condition holds. During preprocessing, the Rust compiler evaluates the predicate. If it evaluates to true, the compiler expands the nested attributes onto the target item as though they were written inline. If the condition is false, the attribute is discarded entirely. This strategy keeps data layout, visibility, and documentation unified while dynamically adjusting capabilities for test suites or cargo feature gates.

## Q&A

### Can `cfg_attr` attach multiple attributes at once?
Yes. You can supply multiple comma-separated attributes within one predicate directive, such as `#[cfg_attr(feature = "serde", derive(Serialize, Deserialize), serde(rename_all = "camelCase"))]`.

### Does `cfg_attr` work on individual fields and variants?
Yes. You can place `#[cfg_attr(...)]` on struct fields, enum variants, modules, functions, or any item that supports standard outer attributes.

### How does `cfg_attr` differ from plain `cfg`?
The `#[cfg(...)]` attribute includes or excludes the annotated item from compilation entirely. In contrast, `#[cfg_attr(...)]` always compiles the underlying item, applying or omitting only the specified metadata.
