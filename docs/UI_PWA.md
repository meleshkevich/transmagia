# Transmagia — UI and PWA Requirements

## 1. Design Direction

Transmagia should feel like a modern digital library / reading platform rather than a generic blog.

Principles:

- calm and readable;
- minimal visual noise;
- strong typography;
- generous whitespace;
- clear hierarchy;
- restrained color use;
- comfortable long-form reading;
- responsive by design.

The content should remain the visual focus.

## 2. Design System

Use:

```text
shadcn/ui
Tailwind CSS
Lucide Icons
```

shadcn/ui is the primary base for admin and general application UI.

The reader should use custom-designed components on top of the same design tokens rather than looking like a stock dashboard.

## 3. Theme / Tokens

Use semantic design tokens such as:

- background
- foreground
- muted
- muted-foreground
- card
- border
- primary
- secondary
- accent
- destructive

Exact colors should be chosen during visual design and should remain easy to change.

## 4. Typography

Reader typography is a first-class concern.

The implementation must:

- support Cyrillic well;
- avoid unnecessarily heavy font payloads;
- use sensible fallbacks;
- provide a comfortable maximum reading width;
- use its own reader typography tokens.

Conceptual reader variables:

```text
reader-font-size
reader-line-height
reader-content-width
reader-paragraph-spacing
```

## 5. Reader Layout

The reader is the primary product experience.

Desktop should use a constrained reading column with generous surrounding space.

Mobile should minimize chrome and maximize readable text.

A compact reader toolbar may contain:

- back/navigation;
- current chapter/book context;
- `Aa` reader settings.

## 6. Reader Preferences

Required v1 controls:

### Font size

Provide multiple bounded sizes, with an intuitive `A- / A / A+` interaction or equivalent.

### Line height

Provide a small number of options, for example:

```text
Compact
Normal
Relaxed
```

### Theme

Provide:

```text
Light
Dark
System
```

These settings should affect reader content, not the entire application UI.

## 7. Persisting Reader Preferences

Persist reader preferences locally using `localStorage` in v1.

Example conceptual payload:

```json
{
  "fontSize": "large",
  "lineHeight": "relaxed",
  "theme": "dark"
}
```

Server synchronization of preferences is out of scope for v1.

## 8. Accessibility

Required baseline:

- semantic HTML;
- visible keyboard focus;
- sufficient contrast;
- accessible labels and errors;
- keyboard support for interactive dialogs/popovers;
- touch-friendly controls;
- respect reduced-motion preferences where relevant;
- do not disable browser zoom;
- do not disable pinch-to-zoom;
- support normal operating-system/browser text scaling.

## 9. Chapter Navigation

Default desktop presentation can be:

```text
Previous chapter     Back to book     Next chapter
```

Mobile may stack or reflow the same actions for touch usability.

## 10. Book Catalog Cards

Public catalog cards may show:

- cover;
- title;
- author;
- short description.

Do not expose protected chapter text in catalog responses.

## 11. Protected Book UX

A visitor who has not passed the section access check may see:

- book cover;
- title;
- author;
- description;
- access/password prompt.

Registered readers and admins should bypass the password prompt.

## 12. Admin UI

Build admin UI primarily with shadcn/ui.

Core admin views:

- Books list;
- Book details;
- Chapter list;
- Chapter editor;
- Comments moderation;
- Users;
- Sections/password settings.

## 13. Tablet Admin

Tablet support is a deliberate requirement.

The following should work well with touch:

- forms;
- dialogs;
- Tiptap editor;
- chapter reordering;
- preview;
- publishing controls;
- navigation/sidebar.

## 14. Phone Admin

Do not spend major engineering effort on long-form book/chapter creation on small phones.

The phone UI should still avoid broken layouts and should support simple admin/navigation actions where practical.

## 15. PWA

Required v1 capabilities:

- manifest;
- icons;
- installable application behavior where supported;
- standalone display mode;
- service worker;
- static asset/app-shell caching;
- responsive reader.

Do not automatically cache all protected chapter content.

## 16. Offline Scope

Full offline reading/library support is not part of v1.

Future ideas may include explicit user-controlled offline saving of books/chapters, but this must be designed with the access model in mind.

## 17. Mobile Navigation

General site navigation may collapse into a drawer/sheet on mobile.

Reader navigation should remain distinct from general site navigation.
