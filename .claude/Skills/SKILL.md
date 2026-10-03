---
name: postelos-ui
description: PostelOS design and UX system. Use whenever designing, reviewing, redesigning, or implementing PostelOS interfaces, dashboards, navigation, onboarding, responsive UI, public pages, subscription UX, or component systems. Enforce simple language, low cognitive load, premium minimalism, futuristic restraint, accessibility, performance, and consistent PostelOS branding.
---
# PostelOS UI/UX SYSTEM
## 1. North Star
PostelOS is a business command center, not a generic admin dashboard.
Core standard:
> Simple enough for anyone. Powerful enough for a serious business.
Every screen should let a first-time user answer quickly:
- Where am I?
- What am I seeing?
- What can I do?
- What needs attention?
- What should I do next?
Design for both extremes: a 10-year-old should understand the main action; a 75-year-old should be able to read, navigate, and recover from mistakes comfortably.
## 2. Non-Negotiable Principles
- Clarity over cleverness.
- Plain language over technical language.
- Progressive disclosure over information dumping.
- One primary action per context.
- Consistency over novelty.
- Feedback after every meaningful action.
- Safe defaults and easy recovery.
- Mobile is a first-class experience.
- Accessibility and performance are design requirements.
- Remove anything that does not help the user.
## 3. Brand Personality
PostelOS should feel:
- premium
- minimal
- futuristic
- intelligent
- calm
- precise
- trustworthy
- fast
- quietly technical
Avoid:
- noisy cyberpunk aesthetics
- excessive neon
- excessive gradients
- heavy glassmorphism
- decorative card grids
- template-like layouts
- generic “AI startup” visuals
Futuristic should come from precision, typography, spacing, depth, motion, and interaction quality before glow.
## 4. Visual Foundation
Default visual direction:
- near-black/deep-black backgrounds
- dark violet/purple primary brand energy
- restrained cyan accent
- white/near-white primary text
- cool muted gray secondary text
Use semantic design tokens, never scattered literals.
Recommended token intent:
`--vx-bg`, `--vx-surface`, `--vx-surface-raised`, `--vx-border`, `--vx-text`, `--vx-text-muted`, `--vx-primary`, `--vx-accent`, `--vx-success`, `--vx-warning`, `--vx-danger`.
Most UI should remain neutral. Accent colors exist to guide attention.
## 5. Typography
Use a clear hierarchy:
- display
- page title
- section title
- body
- label
- helper text
- data/numeric emphasis
Rules:
- Prefer short labels.
- Do not use all-caps for normal copy.
- Use size and weight for hierarchy before extra color.
- Keep long text readable.
- Never shrink body text just to fit more information.
- Make numerical data easy to scan.
## 6. Vocabulary and Content
Use simple professional language.
Prefer:
- Add customer
- Invite team
- View details
- Save changes
- Try again
- Upgrade plan
- Remove access
- Billing
- Settings
Avoid:
- Create new customer record
- Initialize workspace configuration
- Execute operation
- Configuration management
Never use complex wording to make software sound sophisticated.
Errors should explain:
1. What happened.
2. What the user can do next.
## 7. Information Hierarchy
Every screen should normally follow:
1. Page identity
2. Primary task
3. Important status or insight
4. Supporting information
5. Secondary actions
6. Advanced controls
Do not give five things equal visual weight.
## 8. Layout and Spacing
Use a consistent spacing system and shared layout primitives.
Prefer:
- strong alignment
- generous whitespace
- predictable gutters
- readable content widths
- consistent card padding
- aligned data
Do not fill empty space simply because it exists.
## 9. Navigation
Navigation should match the user's mental model, not the developer's folder structure.
Desktop:
- clear sidebar/navigation
- obvious active state
- collapsible navigation when useful
- predictable workspace/account controls
Mobile:
- intentional bottom navigation or compact menu where appropriate
- sticky primary CTA only when it genuinely reduces friction
- never force tiny desktop interactions onto a phone
Use breadcrumbs on deeper pages when they improve orientation.
## 10. Component System
Build reusable components with consistent states.
Core components:
- buttons
- inputs
- selects/comboboxes
- checkboxes/radios/switches
- tabs
- cards
- tables
- badges
- avatars
- tooltips
- dropdowns
- modals/drawers
- toasts/alerts
- breadcrumbs
- pagination
- search
- command menu
- skeletons
- empty/error/loading states
Interactive components should support, where relevant:
- default
- hover
- focus-visible
- active
- disabled
- loading
- success
- error
Do not make one-off components that visually contradict shared components.
## 11. Buttons and CTAs
Hierarchy:
- Primary = dominant action
- Secondary = supporting action
- Tertiary = low emphasis
- Destructive = dangerous action
Button text should describe the result:
- Add customer
- Save changes
- Start trial
- Upgrade plan
- Invite team
Avoid vague labels such as “Continue” when the real action can be named.
Public pages should expose the primary CTA above the fold.
## 12. Forms
Forms should feel guided, not bureaucratic.
Rules:
- group related fields
- use clear labels
- use useful defaults
- validate near the problem
- preserve input after recoverable errors
- ask only for information needed now
- split long flows into logical steps
- use concise inline help for unfamiliar concepts
## 13. Tables and Dense Data
Tables exist for comparison and action.
Rules:
- keep columns purposeful
- prioritize important fields
- make rows scannable
- align numeric values consistently
- include meaningful empty states
- add search/filter/sort only when useful
- give mobile a deliberate strategy
Never turn the UI into an unstructured spreadsheet wall.
## 14. Dashboard Rules
The dashboard should answer:
- What is happening?
- What needs attention?
- What should I do next?
- How are we doing?
Only show metrics that help the user understand status, make decisions, or act.
Prefer a small number of meaningful insights over a grid of decorative numbers.
## 15. Empty, Loading, Error, and Success States
### Empty state
Use:
- short title
- one-sentence explanation
- one relevant CTA
Example:
“No customers yet.”
“Add your first customer to start tracking activity.”
[Add customer]
### Loading
Use skeletons when the structure is known; progress when duration matters. Never let the UI appear frozen.
### Error
Do not expose raw server errors to normal users. Give a clear explanation and recovery path.
### Success
Confirm important actions clearly: “Changes saved”, “Team member invited”, “Customer added”.
## 16. Accessibility
Aim for WCAG-compatible implementation.
Minimum expectations:
- semantic HTML
- keyboard access
- visible focus states
- sensible focus order
- readable contrast
- descriptive labels
- accessible form errors
- useful touch targets
- reduced-motion support
- no information conveyed only by color
- accessible names for icon-only controls
Prefer native HTML semantics over unnecessary ARIA.
## 17. Motion
Motion should explain change, not compete with the task.
Good uses:
- page/route transitions
- expanding/collapsing content
- drawers/modals
- success feedback
- subtle hover states
- loading progression
Avoid:
- constant movement
- long transitions
- animation on everything
- effects that delay completion
Respect `prefers-reduced-motion`.
## 18. Futuristic Effects
Use advanced effects selectively:
- restrained glow
- subtle gradients
- depth
- fine grid textures
- particles
- cursor-reactive movement
- restrained WebGL
Use effects for identity or emphasis, not every surface.
Performance wins over spectacle.
## 19. Responsive Design
Treat mobile, tablet, desktop, and large desktop as intentional compositions.
Do not simply shrink desktop UI.
Examples:
- sidebar becomes mobile navigation
- card grids become focused stacks
- dense tables transform or gain deliberate horizontal scrolling
- toolbars collapse into compact controls
- secondary actions move into menus
Critical workflows must remain easy with touch.
## 20. Subscription and Paywall UX
PostelOS is intended to become a paid SaaS.
Paywalls should explain value, not punish users.
A locked feature should answer:
- What is it?
- Why is it useful?
- Which plan includes it?
- What happens if I upgrade?
Avoid dark patterns, fake urgency, confusing pricing, and aggressive interruptions.
Keep entitlement logic centralized and reusable.
## 21. Roles and Permissions
PostelOS should support department-oriented access.
Mental model examples:
- Admin: full control
- Sales: sales work
- Support: customer support work
- Finance: financial work
Use simple wording such as:
“Give this person access to Sales.”
Do not expose internal implementation terminology when a business term is clearer.
Never rely on hiding UI elements for authorization; real permission checks belong in the application security layer.
## 22. Onboarding
Teach by doing.
Ideal sequence:
1. Understand the product.
2. Configure the workspace.
3. Complete one useful action.
4. Invite team members when relevant.
5. Reach a first meaningful outcome.
Avoid giant setup forms. Use progress/checklists only when they reduce uncertainty.
## 23. Search and Command UX
Use global search when the product contains enough content to justify it.
Search should find things users actually need: pages, customers, tasks, settings, and business objects.
A command palette is a power-user layer, not a requirement for normal users.
## 24. Public-Facing Pages
For public PostelOS pages:
- communicate the value proposition immediately
- place the main CTA above the fold
- use concise sections
- add useful internal links
- add FAQs where helpful
- provide a professional thank-you page
- provide a useful branded 404
- use unique titles and meta descriptions
- use social sharing metadata
- use descriptive alt text
- use canonical URLs where applicable
- use relevant structured data
- provide robots/sitemap support where appropriate
SEO should improve discoverability without creating keyword sludge.
## 25. Trust, Legal, Support
Important surfaces should expose appropriate:
- privacy policy
- terms
- support/contact path
- billing clarity
- security context where appropriate
- truthful response-time promise
Never invent certifications, legal claims, customer counts, guarantees, or performance statistics.
## 26. Analytics
Track meaningful product events, not every meaningless click.
Possible events:
- sign_up
- onboarding_completed
- team_invited
- first_customer_created
- key_feature_used
- checkout_started
- subscription_started
- plan_upgraded
- subscription_cancelled
Minimize sensitive data collection. Keep analytics configuration out of source code where secrets are involved.
## 27. SEO Metadata
Public pages should have, where applicable:
- unique title
- unique meta description
- canonical URL
- Open Graph metadata
- social image
- correct heading hierarchy
- descriptive alt text
- relevant structured data
- correct robots directives
Never copy the same metadata across every page.
## 28. Performance
Performance is part of UX.
Prefer:
- lightweight components
- lazy loading for non-critical content
- responsive images
- code splitting when beneficial
- efficient animation
- minimized unnecessary requests
- caching where safe
Do not add heavy effects without measurable product value.
## 29. Interaction Quality
Every interaction must communicate cause and effect.
When a user acts:
- show expected state change
- prevent accidental duplicate submission
- preserve context where possible
- provide feedback
- make failures recoverable
Avoid dead clicks, mysterious icons, and unclear state.
## 30. Iconography
Use one coherent icon family.
Rules:
- use familiar meanings
- label unfamiliar actions
- never choose an icon only because it looks attractive
- maintain consistent size/stroke treatment
- give icon-only controls accessible names and tooltips when useful
## 31. Charts
A chart must answer a question.
Use charts for meaningful trends, comparisons, distributions, or status. Do not add charts merely because dashboards “should have charts.”
Do not rely only on color to distinguish data.
## 32. Reference Sites
Use these as inspiration only:
Particles / Casberry:
https://particles.casberry.in/
DaisyUI:
https://daisyui.com/
DaisyUI Nexus:
https://nexus.daisyui.com/
OriginKit:
Use as reference for premium SaaS hierarchy, spacing, composition, and product presentation.
When browser access or screenshots are available, study principles, interaction patterns, motion, hierarchy, and component ideas. Never clone proprietary assets, branding, text, or layouts.
## 33. Implementation Rules
Before changing a page:
1. Inspect the current implementation.
2. Identify what already works.
3. Identify confusing, broken, or duplicated behavior.
4. Preserve valuable existing functionality.
5. Improve structure before decoration.
Prefer the existing project stack unless there is a compelling technical reason to change it.
Use shared tokens and reusable components.
Avoid unnecessary dependencies and broad rewrites that create regression risk.
## 34. Code Quality and Security
When implementing UI:
- keep components composable
- keep state predictable
- avoid duplicated business logic
- keep permissions centralized
- keep secrets out of source
- use semantic names
- remove dead code only when safely verified
- protect routes and data at the proper authorization layer
## 35. Design Review Checklist
Before considering a UI task finished, verify:
### Understanding
- Page purpose is obvious.
- Primary action is obvious.
- Labels are understandable without technical knowledge.
### Hierarchy
- One thing is clearly primary.
- Secondary information is visually quieter.
- There is enough whitespace.
### Interaction
- Buttons do what labels promise.
- Loading/success/error/disabled/empty states exist where needed.
- Duplicate actions are prevented.
### Accessibility
- Keyboard navigation works.
- Focus is visible.
- Contrast is readable.
- Icon-only controls have accessible names.
- Reduced motion is respected.
### Responsive
- Mobile is intentionally composed.
- Touch targets are practical.
- Critical actions remain accessible.
- Dense content has a mobile strategy.
### Performance
- No unnecessary heavy animation.
- No obvious layout shift.
- No avoidable requests.
- No expensive visual effect without product value.
### Brand
- It feels like PostelOS.
- It is futuristic without being noisy.
- It is premium without being flashy.
- It is distinctive without copying references.
## 36. Final Decision Rule
When two UI options are both valid, choose the one that:
1. needs less explanation,
2. needs fewer actions,
3. assumes less from the user,
4. is easier to recover from,
5. is more accessible,
6. performs better,
7. fits the shared PostelOS system.
The best interface is not the one that demonstrates the most design technique.
It is the one that makes the user feel like they already knew how to use it.
## 37. Completion Standard
Do not declare a PostelOS UI task complete because it compiles.
Complete means:
- the main workflow works
- the interface is understandable
- responsive behavior is intentional
- important states are covered
- accessibility is considered
- errors/loaders/empty states are handled
- visual hierarchy is coherent
- no major console or interaction errors remain
- the experience feels trustworthy and paid-product quality
When in doubt:
**Make it simpler. Make the hierarchy clearer. Remove what does not help.**
