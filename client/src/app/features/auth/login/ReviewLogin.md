# ReviewLogin.md: Login Feature Architecture & Modification Guide

This document acts as a developer index and directory map for the modular React & SCSS login system. Review this file to quickly locate components, variables, and styling classes before making changes.

---

## 1. Directory Structure

All files related to the Login interface are situated in `src/components/Login/`. The layout is structured as follows:

```
src/components/Login/
├── ReviewLogin.md            <-- This guide
├── variables.scss            <-- Global design tokens (fonts, colors, mixins)
├── variables.scss            <-- Global styling rules (resets)
│
└── LoginLayout/                         <-- Root Parent Coordinator
    ├── LoginLayout.jsx
    ├── LoginLayout.scss
    │
    ├── HeroPanel/                       <-- Child of LoginLayout
    │   ├── HeroPanel.jsx
    │   └── HeroPanel.scss
    │
    ├── LoginForm/                       <-- Child of LoginLayout
    │   ├── LoginForm.jsx
    │   ├── LoginForm.scss
    │   │
    │   ├── RememberMe/                  <-- Child of LoginForm
    │   │   ├── RememberMe.jsx
    │   │   └── RememberMe.scss
    │   │
    │   ├── SignupPrompt/                <-- Child of LoginForm
    │   │   ├── SignupPrompt.jsx
    │   │   └── SignupPrompt.scss
    │   │
    │   └── RoleSelector/                <-- (Moved to Shared/Form/RoleSelector)
    │
    ├── ForgotPasswordForm/              <-- Child of LoginLayout
    │   ├── ForgotPasswordForm.jsx
    │   ├── ForgotPasswordForm.scss
    │   └── OtpInput/                    <-- Child of ForgotPasswordForm
    │       ├── OtpInput.jsx
    │       └── OtpInput.scss
    │
    └── Shared/                          <-- Shared by forms under LoginLayout
        ├── InputField/
        │   ├── InputField.jsx
        │   ├── InputField.scss
        │   └── PasswordToggle/          <-- Child of InputField
        │       ├── PasswordToggle.jsx
        │       └── PasswordToggle.scss
        ├── Button/
        │   ├── Button.jsx
        │   ├── Button.scss
        │   └── Shine/                   <-- Child of Button
        │       ├── Shine.jsx
        │       └── Shine.scss
        ├── Logo/
        │   ├── Logo.jsx
        │   └── Logo.scss
        └── FormHeader/
            ├── FormHeader.jsx
            └── FormHeader.scss
```

---

## 2. Component Directory & Customization Matrix

Refer to this matrix to find exactly which files to edit when making standard layout changes:

| Modification Target                                              | JSX File                                                                                                                                                                     | Stylesheet File                                                                                                                   |
| :--------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Global Tokens** (Colors, Radii, Fonts, Transitions)            | N/A                                                                                                                                                                          | [variables.scss](file:///d:/Hackathon-UI/UI/src/components/Login/variables.scss)                                                  |
| **Entire Layout Canvas** (Screen Split, viewport, media queries) | [LoginLayout.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginLayout.jsx)                                                                               | [LoginLayout.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginLayout.scss)                                  |
| **Left Branding Panel**                                          | [HeroPanel.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/HeroPanel/HeroPanel.jsx)                                                                         | [HeroPanel.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/HeroPanel/HeroPanel.scss)                            |
| **Form Page Alignment**                                          | [LoginForm.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginForm/LoginForm.jsx)                                                                         | [LoginForm.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginForm/LoginForm.scss)                            |
| **Forgot Password Recovery Form**                                | [ForgotPasswordForm.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/ForgotPasswordForm/ForgotPasswordForm.jsx)                                              | [ForgotPasswordForm.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/ForgotPasswordForm/ForgotPasswordForm.scss) |
| **Logo Text & Shape**                                            | [Logo.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/DataDisplay/Logo/Logo.jsx)                                                                                       | [Logo.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/DataDisplay/Logo/Logo.scss)                                          |
| **Greetings Title / Description text**                           | [FormHeader.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/DataDisplay/FormHeader/FormHeader.jsx)                                                                     | [FormHeader.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/DataDisplay/FormHeader/FormHeader.scss)                        |
| **Email & Password Fields**                                      | [InputField.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/InputField/InputField.jsx)                                                                            | [InputField.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/InputField/InputField.scss)                               |
| **Password Visibility Padlock Toggle**                           | [PasswordToggle.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/InputField/PasswordToggle/PasswordToggle.jsx)                                                     | [PasswordToggle.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/InputField/PasswordToggle/PasswordToggle.scss)        |
| **Remember Checkbox & Restore Link**                             | [RememberMe.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginForm/RememberMe/RememberMe.jsx)                                                            | [RememberMe.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/LoginForm/RememberMe/RememberMe.scss)               |
| **Submit / Google Buttons**                                      | [Button.jsx](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/Shared/Button/Button.jsx)                                                                           | [Button.scss](file:///d:/Hackathon-UI/UI/src/components/Login/LoginLayout/Shared/Button/Button.scss)                              |
| **Button Shine Sweep Animation**                                 | Implemented as CSS `::after` pseudo-element animation in [Button.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/Buttons/Button/Button.scss)                          |
| **Role Selector Container**                                      | [RoleSelector.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/RoleSelector/RoleSelector.jsx) — Icons sourced from `lucide-react` (`User`, `Users`, `LockKeyhole`) | [RoleSelector.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/RoleSelector/RoleSelector.scss)                         |
| **Role Option Item**                                             | [RoleCard.jsx](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/RoleSelector/RoleCard/RoleCard.jsx)                                                                     | [RoleCard.scss](file:///d:/Hackathon-UI/UI/src/components/Shared/Form/RoleSelector/RoleCard/RoleCard.scss)                        |

---

## 3. Style Guidelines & Design Tokens

### Colors

- Primary dark text & black buttons: Use `$color-black` (`#000000`)
- Forms and page base canvas: Use `$color-white` (`#ffffff`)
- Input fields default background: Use `$color-gray-100` (`#f3f4f6`)
- Secondary descriptions & muted items: Use `$color-gray-600` (`#4b5563`)
- Placeholder grey: Use `$color-gray-400` (`#9ca3af`)
- Secondary buttons border line: Use `$color-gray-200` (`#e5e7eb`)
- Error background: Use `#fef2f2` (soft red)
- Error input border line: Use `#fca5a5` (light red)
- Error typography message: Use `#e11d48` (red text) and `#ef4444` (red label)

### Focus States

When an input field is focused (clicked):

- The outline is set to `none` and the border color is set to `transparent` to completely hide any borders or outlines.
- Code configuration:
    ```scss
    &:focus {
        border-color: transparent;
        outline: none;
        box-shadow: none;
    }
    ```
- No borders or outlines are shown on hover state (`:hover`).

### Typography Fonts

- Serif Headings ("Welcome Back"): `Bodoni Moda` (import from Google Fonts).
- Sans-serif UI Elements (Inputs, Buttons, Footers): `Plus Jakarta Sans`.

---

## 4. Maintenance Rule

> [!IMPORTANT]
> When adding or refactoring components or visual attributes inside the Login module, please update this `ReviewLogin.md` map to keep it synchronized with the latest file hierarchy.

---

## 5. Change Log

### 2026-07-21

#### `RoleSelector.jsx` — Lucide React icon migration

- **Removed** three hand-rolled inline SVG components (`AdminIcon`, `ManagerIcon`, `MemberIcon`).
- **Added** import from `lucide-react`: `{ LockKeyhole, Users, User }`.
- Role-to-icon mapping:
    | Role             | Lucide Icon   |
    | :--------------- | :------------ |
    | Workspace Member | `User`        |
    | Team Manager     | `Users`       |
    | Administrator    | `LockKeyhole` |

#### `LoginForm.jsx` — Browser autofill prevention

- Added `autoComplete="off"` on the `<form>` element.
- Inserted two **hidden honeypot inputs** (`name="fake-email"` / `name="fake-password"`) as the first children of the form. These absorb browser credential injection before it reaches the real fields.
- Changed both real inputs from `autoComplete="off"` → `autoComplete="new-password"` (browsers respect this value and do not inject saved login credentials).
- Renamed input `id` attributes: `"email"` → `"login-email"`, `"password"` → `"login-password"` to avoid browser pattern-matching that triggers credential autofill.
