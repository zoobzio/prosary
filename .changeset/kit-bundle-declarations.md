---
"@prosary/kit": patch
---

Emit a declaration beside each locale bundle, `messages/<locale>.d.mts`, typed as the `Bundle` of the contract. A consumer that imports one bundle directly — a package that formats from its source locale with no loader — no longer has to declare it.
