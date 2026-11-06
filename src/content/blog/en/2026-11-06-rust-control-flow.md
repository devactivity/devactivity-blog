---
title: "Rust Loop: Returning Values Directly with break"
description: "Rust loops are expressions that can return values directly via break. Avoid mutable accumulator flags outside the loop and assign the loop result directly."
pubDate: 2026-11-06
tags: ["rust", "control-flow"]
category: "SNIPPET"
no: "10"
lang: "en"
draft: false
---

## TL;DR

In Rust, `loop` is an expression. You can pass a value to `break` to return data directly from the loop, eliminating outer `mut` variables and keeping your retry, polling, or search logic concise and safe.

## The wrong way

Developers coming from languages where loops are statements often rely on mutable state outside the loop to extract values:

```rust
let mut result = None;
let mut attempts = 0;

loop {
    attempts += 1;
    if attempts == 3 {
        result = Some(attempts * 10);
        break;
    }
}

let final_val = result.unwrap();
```

This pattern pollutes outer scopes with unnecessary mutable variables and forces you to initialize placeholder containers like `Option`. It introduces boilerplate, weakens type guarantees, and risks runtime panics if `result` is unwrapped without being set.

## The right way

Use the `loop` construct as an expression by providing a return value to the `break` keyword:

```rust
let mut attempts = 0;

let final_val = loop {
    attempts += 1;
    if attempts == 3 {
        break attempts * 10;
    }
};
```

Because `break` accepts an expression, Rust treats the entire loop as producing that type. The variable `final_val` is declared immutable, initialized directly upon loop completion, and completely eliminates intermediate wrapper types and hazardous unwraps.

## Q&A

### Can while and for loops also return values with break?

No, only unconditioned `loop` constructs can return values because the compiler cannot guarantee that `for` or `while` loops will execute their break expressions. When those conditional loops terminate normally without a break, they evaluate strictly to the unit type `()`.

### Can you return a value from a nested loop using a label?

Yes, you can target an outer labeled loop by placing the label before the return value, such as `break 'search item;`. This exits nested blocks cleanly while passing the computed result directly to the outer assignment.

### What is the evaluated type of an infinite loop that never breaks?

An infinite loop without a `break` evaluates to the `!` never type. Because control flow never proceeds past it, Rust allows it to coerce into any expected type in match arms or function returns.
