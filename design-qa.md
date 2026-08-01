# iOS Timetable Widget Design QA

**Source visual truth**

- `C:\Users\Frank\.codex\codex-remote-attachments\019fa71d-661a-7f92-9736-b04c59119746\2E1BFCBF-77F1-45C1-AF5F-A9ED929A3280\1-照片-1.jpg`
- Source image: 588 × 1280 px at 1× density.
- Source widget crop: 511 × 532 px, normalized to 510 × 530 px for comparison.

**Rendered implementation evidence**

- Full browser-rendered implementation: `artifacts/design-qa/ios-timetable-widget-final.jpg`
- Focused implementation crop: `artifacts/design-qa/ios-timetable-widget-implementation.jpg`
- Side-by-side comparison: `artifacts/design-qa/ios-timetable-widget-comparison.jpg`
- Chrome CSS viewport: 590 × 900 px.
- Browser screenshot: 575 × 877 px (Chrome capture scale ≈ 0.9746).
- Rendered widget CSS box: 517.8125 × 533.34375 px.
- Rendered widget crop: 505 × 520 px, normalized to 510 × 530 px for comparison.
- State: Chinese, Spring 2026 Week 1, formally allocated Mathematics tutorial (`Widget Parameter 18`), installation section expanded.

**Full-view comparison evidence**

- The implementation preserves the reference composition: near-square dark card, rounded corners, orange status/progress treatment, compact section heading, four colour-coded rows, green completion track, and quiet bottom metadata.
- The surrounding personal-app view keeps the existing light-paper design and clearly explains that this is an iOS Home Screen widget rather than an in-page timetable replacement.

**Focused region comparison evidence**

- The combined comparison board places the normalized source widget on the left and the normalized implementation on the right.
- Typography uses the project/system sans stack; the native Scriptable script uses iOS system fonts, so the installed widget will use San Francisco as expected.
- Horizontal padding, progress-track length, row alignment, coloured course dots, corner radius, and bottom metadata placement are visually aligned with the reference.
- Source task copy was intentionally replaced with current course code, activity, time, room/online location, and relative day. Dynamic progress and update time are also intentional product differences.
- No external image assets appear inside the source widget, so no raster asset substitution was required.

**Findings**

- No actionable P0, P1, or P2 differences remain.
- P3: The web preview’s course-detail text is slightly denser than the reference task subtitles. This is acceptable because room codes and activity names are functional timetable data; the native Scriptable version uses iOS system font scaling and line limits.
- P3: The displayed percentage differs from the static reference because it is calculated from the actual day and time.

**Primary interactions tested**

- Opened the Learning Plan view from bottom navigation.
- Verified the iOS widget preview and expanded installation instructions render at the target viewport.
- Opened the selectable personal timetable.
- Changed Mathematics from the official 18:00 option to the 11:00 waitlist preview and verified both the preview row and `Widget Parameter` changed to `11`.
- Verified `/widgets/deepstudy-timetable.js` returns HTTP 200 and contains the Scriptable payload.
- Checked Chrome console output: no application error or warning was present; the only warnings were emitted by an unrelated browser extension content script.

**Comparison history**

1. First pass
   - Finding: the preview measured 304.5625 × 390 px at the phone viewport, making it narrower and taller than the reference.
   - Finding: the green completion track was pinned together with the bottom metadata, leaving the wrong vertical rhythm.
   - Fix: widened the preview inside its container, removed the fixed minimum height, and used the reference’s near-square aspect ratio.
   - Fix: increased row density/legibility and separated the completion track from the bottom metadata so the track follows the course rows while update text remains bottom-aligned.
2. Final pass
   - Evidence: source-sized render measured 517.8125 × 533.34375 CSS px and normalized comparison is 510 × 530 px on both sides.
   - Result: no actionable P0/P1/P2 mismatch remains.

**Implementation checklist**

- [x] Actual Scriptable `ListWidget`, not a decorative web-only mock.
- [x] Large, medium, and small family handling.
- [x] Future seven-day classes, room/online labels, weekly progress, offline data, and app deep link.
- [x] Semester teaching weeks and 21–27 September break.
- [x] Mathematics parameters `18`, `11`, and `13`.
- [x] Touch-sized copy/open/download installation controls.
- [x] Browser-rendered Chrome evidence and focused comparison board.

final result: passed
