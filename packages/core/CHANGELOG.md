# @srt2fcpx/core

## 0.0.1

### Patch Changes

- e9e5e92: Enhance XML escaping with comprehensive security measures

  - Replace basic 5-character escaping with context-aware processing
  - Add XML injection prevention with dangerous pattern validation
  - Implement separate escaping functions for attributes vs content
  - Add control character filtering while preserving Unicode
  - Expand test coverage with 9 new security test cases
  - Establish secure processing pipeline: validation → sanitization → escaping
