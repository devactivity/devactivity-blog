---
title: "dyn Trait: Return Multiple Types at Runtime"
description: "Rust requires a single concrete type for impl Trait return types. To return different types across runtime branches, box them into dynamic trait objects."
pubDate: 2026-10-27
tags: ["rust", "types,-traits,-generics"]
category: "VIDEO"
youtubeId: "zLE7jXlGub8"
no: "03"
lang: "en"
draft: false
---

## TL;DR

Rust's `impl Trait` uses static dispatch and requires every branch to return the exact same concrete type. When runtime conditions dictate returning distinct types implementing a common trait, return a boxed trait object like `Box<dyn Trait>` instead.

## The wrong way

```rust
trait Formatter {
    fn format(&self, text: &str) -> String;
}

struct Plain;
struct Bold;

impl Formatter for Plain {
    fn format(&self, text: &str) -> String {
        text.to_string()
    }
}

impl Formatter for Bold {
    fn format(&self, text: &str) -> String {
        format!("**{text}**")
    }
}

fn get_formatter(is_bold: bool) -> impl Formatter {
    if is_bold {
        Bold
    } else {
        Plain
    }
}
```

The compiler rejects `get_formatter` with error `E0308: 'if' and 'else' have incompatible types`. Although both `Bold` and `Plain` implement `Formatter`, `impl Trait` in return position does not enable dynamic dispatch. It represents a single concrete type determined at compile time. Because `Bold` and `Plain` are distinct types with different layouts, the compiler cannot unify them into one static signature.

## The right way

```rust
fn get_formatter(is_bold: bool) -> Box<dyn Formatter> {
    if is_bold {
        Box::new(Bold)
    } else {
        Box::new(Plain)
    }
}

fn main() {
    let formatter = get_formatter(true);
    println!("{}", formatter.format("hello"));
}
```

By returning `Box<dyn Formatter>`, the function produces a trait object backed by dynamic dispatch. A trait object combines a pointer to the heap-allocated instance with a pointer to its virtual method table (vtable). Because both `Box<Bold>` and `Box<Plain>` coerce into the identical fat pointer type `Box<dyn Formatter>`, each conditional branch returns a uniform type of known size at compile time while resolving methods at runtime.

## Q&A

### What is the performance cost of dynamic dispatch?
Trait objects require a heap allocation via `Box` and indirect method calls through a vtable, preventing compiler inlining. This small overhead is negligible for branching logic that genuinely requires runtime polymorphic behavior.

### Can an enum replace Box<dyn Trait>?
Yes, if all possible variants are known ahead of time within your crate. Wrapping implementations in an enum avoids heap allocations and dynamic dispatch while preserving closed polymorphism.

### Why not use impl Trait with an unboxed dyn Trait?
Raw `dyn Trait` is unsized (`!Sized`) because different implementing structs require varying amounts of memory. Rust requires function return values to have a known size at compile time, necessitating indirection such as `Box` or `&`.
