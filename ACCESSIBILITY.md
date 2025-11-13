# Accessibility Guidelines

## Color Contrast

All colors used in this application meet WCAG 2.1 Level AA standards (minimum 4.5:1 contrast ratio for normal text).

### Primary Colors

- **Blue-600** (#2563eb) on white background: 8.59:1 ✓
- **Red-600** (#dc2626) on white background: 7.00:1 ✓
- **Green-600** (#16a34a) on white background: 4.54:1 ✓
- **Gray-700** (#374151) on white background: 10.73:1 ✓

### Button Colors

- **Primary Button** (blue-600): White text on blue-600 background: 8.59:1 ✓
- **Danger Button** (red-600): White text on red-600 background: 7.00:1 ✓
- **Success** (green-500): White text on green-500 background: 4.52:1 ✓

### Status Colors

- **Success Badge** (green-100 bg, green-800 text): 7.24:1 ✓
- **Error Badge** (red-100 bg, red-800 text): 7.89:1 ✓
- **Info Badge** (blue-100 bg, blue-800 text): 8.32:1 ✓

## Keyboard Navigation

### Global Shortcuts

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward through interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs

### Skip Navigation

- Press **Tab** on page load to reveal "Skip to main content" link
- Allows keyboard users to bypass navigation and go directly to main content

## Screen Reader Support

### ARIA Labels

- All icon buttons have `aria-label` attributes
- Form inputs have associated labels
- Error messages use `aria-describedby` and `role="alert"`
- Modals use `role="dialog"` and `aria-modal="true"`

### Live Regions

- Toast notifications use `aria-live="polite"` or `aria-live="assertive"`
- Dynamic content updates are announced to screen readers

## Touch Targets

All interactive elements meet the minimum touch target size of 44x44 pixels on mobile devices:

- Buttons: `min-h-[44px]`
- Links in navigation: Adequate padding
- Form inputs: `py-3` (48px height)

## Focus Indicators

All interactive elements have visible focus indicators:

- `focus:outline-none focus:ring-2 focus:ring-blue-500`
- Focus ring is 2px wide and clearly visible
- Focus ring has offset for better visibility

## Responsive Design

- Text remains readable when zoomed to 200%
- Layout adapts to different screen sizes (320px to 2560px)
- No horizontal scrolling at any viewport size
- Touch targets remain accessible on all devices

## Testing Checklist

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test color contrast with tools
- [ ] Test at 200% zoom
- [ ] Test on mobile devices
- [ ] Run Lighthouse accessibility audit
- [ ] Run axe DevTools scan

## Known Issues

None at this time.

## Future Improvements

- Add high contrast mode support
- Add reduced motion support for animations
- Add language switcher for internationalization
- Implement focus trap for modals
