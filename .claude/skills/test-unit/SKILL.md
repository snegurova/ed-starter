---
name: test-unit
description: Use this skill when the user asks to generate, write, or add unit tests in Vitest for TypeScript/JavaScript code — pasted directly or pointed to by a file path. Triggers include "write tests", "generate tests", "add unit tests", "cover with tests", "Vitest tests", "unit tests", and any request to cover a specific function, module, or file with tests.
---

Generate Vitest unit tests for the referenced code or file.

Requirements:
- Import from vitest: describe, it, expect, vi
- Test the happy path and edge cases
- Mock external dependencies with vi.mock()
- Test names in Polish, descriptive
- At least 3 tests per public function

Place the test file next to the source file with a .test.ts suffix.
