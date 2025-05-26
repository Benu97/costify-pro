# Costify Pro - UI/UX Improvements TODO

## 🎯 High Priority - Component Functionality Issues

### 1. Ingredients Tab - More Options Button
**Status:** ❌ Not Working
**Task:** Implement the "More Options" button functionality on ingredient cards
**Prompt:** 
```
"Add a functional dropdown menu for the 'More Options' button on ingredient cards. The menu should include:
- Edit ingredient
- Delete ingredient
- Duplicate ingredient
- View usage in meals
Use shadcn/ui DropdownMenu component with proper icons and styling."
```

### 2. Add Ingredients Button
**Status:** ❌ Not Working
**Task:** Create ingredient addition functionality
**Prompt:**
```
"Implement the 'Add Ingredient' button to open a modal dialog for creating new ingredients. The form should include:
- Ingredient name (required)
- Unit type (dropdown: kg, g, l, ml, pieces, etc.)
- Price per unit (number input with currency)
- Category (optional)
Use shadcn/ui Dialog with proper form validation and toast notifications."
```

### 3. Meals Tab - View Details Button
**Status:** ❌ Not Working
**Task:** Create meal details modal with editing capabilities
**Prompt:**
```
"Implement the 'View Details' button for meals to open a detailed modal showing:
- Meal name and description (editable)
- List of ingredients with quantities (add/remove/edit)
- Individual ingredient costs breakdown
- Total meal cost calculation
- Save/Cancel buttons
Use a responsive modal with tabbed interface for better organization."
```

### 4. Create Meal Button
**Status:** ❌ Not Working
**Task:** Implement meal creation functionality
**Prompt:**
```
"Create the 'Create Meal' button functionality with a multi-step modal:
Step 1: Basic info (name, description)
Step 2: Add ingredients (searchable dropdown, quantity input)
Step 3: Review and calculate costs
Include ingredient search, quantity management, and cost preview."
```

### 5. Add to Cart Popup for Meals
**Status:** ❌ Needs Enhancement
**Task:** Replace simple add-to-cart with popup dialog
**Prompt:**
```
"Replace the current add-to-cart functionality for meals with a modal dialog containing:
- Meal name and image
- Quantity input (number stepper, default: 1)
- Markup percentage input (no default value, required field)
- Calculated price preview (net/gross)
- Add to Cart and Cancel buttons
Show real-time price calculations as user inputs values."
```

### 6. Add to Favourites Button
**Status:** ❓ Unclear Implementation
**Task:** Clarify and implement favourites functionality
**Prompt:**
```
"Implement a favorites system for meals and packets:
- Add heart icon button on meal/packet cards
- Toggle favorite state with animation
- Create favorites filter/tab
- Store favorites in local storage or database
- Visual indication of favorited items"
```

### 7. Create Packet Button
**Status:** ❌ Not Working
**Task:** Implement packet creation functionality
**Prompt:**
```
"Create the 'Create Packet' button with multi-step modal:
Step 1: Basic packet info (name, description)
Step 2: Add meals to packet (searchable, quantity selection)
Step 3: Review costs and markup options
Include meal search, bundle pricing, and cost calculations."
```

### 8. Packets Tab - View Details Button
**Status:** ❌ Not Working
**Task:** Create packet details modal
**Prompt:**
```
"Implement 'View Details' for packets showing:
- Packet name/description (editable)
- List of included meals with quantities
- Individual meal costs and total packet cost
- Edit/remove meals from packet
- Cost breakdown visualization"
```

### 9. Add to Cart Popup for Packets
**Status:** ❌ Missing Feature
**Task:** Implement packet cart popup similar to meals
**Prompt:**
```
"Create add-to-cart modal for packets with:
- Packet name and contents preview
- Quantity input (stepper, default: 1)
- Markup percentage input (no default, required)
- Price breakdown (meals + markup)
- Real-time calculation display
Match the design and functionality of the meal cart popup."
```

## 💰 Pricing and Display Issues

### 10. Display Meal and Packet Prices
**Status:** ❌ Missing Prices
**Task:** Add price display to meal and packet cards
**Prompt:**
```
"Add price display to meal and packet cards similar to ingredients:
- Calculate base price from ingredients/meals
- Show price prominently on cards
- Format currency consistently (€X.XX)
- Add 'per portion' or 'per packet' labels
- Consider price override functionality"
```

### 11. Cart Item Width and Text Visibility
**Status:** ❌ Layout Issue
**Task:** Fix cart item layout and text overflow
**Prompt:**
```
"Fix the shopping cart item layout issues:
- Make cart items responsive to sidebar width
- Implement proper text wrapping/truncation
- Add tooltips for truncated text
- Ensure all important information is visible
- Test with various sidebar widths (collapsed/expanded)"
```

## 🔧 Functional Issues

### 12. Export PDF Button
**Status:** ❌ Not Working
**Task:** Implement PDF export functionality
**Prompt:**
```
"Implement PDF export for shopping cart:
- Use a PDF generation library (jsPDF or react-pdf)
- Include cart items, quantities, prices, markup
- Add company branding/header
- Format as professional quote/invoice
- Download functionality with proper filename"
```

### 13. Finalize Cart Functionality
**Status:** ❓ Purpose Unclear
**Task:** Clarify and redesign finalize cart purpose
**Prompt:**
```
"Redesign the 'Finalize Cart' functionality for planning purposes:
- Rename to 'Save Quote' or 'Save Planning'
- Save cart as a saved quote/plan
- Add quote naming and dating
- Create quote history/management
- Export/share saved quotes
- Clear current cart after saving"
```

## 🎨 UI/UX Enhancements

### 14. Increase Tab Heights and Text Sizes
**Status:** ❌ Design Enhancement
**Task:** Improve visual hierarchy and readability
**Prompt:**
```
"Enhance the visual design of tabs and navigation:
- Increase tab button heights for better touch targets
- Enlarge tab text and icon sizes
- Improve logo/brand element sizing
- Maintain proper spacing and alignment
- Test on different screen sizes for consistency"
```

### 15. Flexible Search Bar Layout
**Status:** ❌ Layout Issue
**Task:** Make search bar responsive to sidebar state
**Prompt:**
```
"Make the search bar responsive to cart sidebar state:
- Expand search bar when cart is collapsed
- Shrink when cart is expanded
- Smooth transition animations
- Maintain consistent spacing with tabs
- Ensure search functionality isn't affected"
```

### 16. Add Color Accents and Visual Appeal
**Status:** ❌ Design Enhancement
**Task:** Enhance color scheme while maintaining professionalism
**Prompt:**
```
"Add tasteful color accents to improve visual appeal:
- Define a cohesive color palette (primary, secondary, accent)
- Add subtle color coding for different item types
- Enhance button states and hover effects
- Add color to important CTAs and status indicators
- Maintain dark theme compatibility
- Test color accessibility and contrast ratios"
```

## 📋 Implementation Strategy

1. **Phase 1:** Core functionality fixes (items 1-4, 7-8)
2. **Phase 2:** Cart and pricing improvements (items 5, 9-11)
3. **Phase 3:** Advanced features (items 6, 12-13)
4. **Phase 4:** UI/UX polish (items 14-16)

## 🧪 Testing Checklist

- [ ] All buttons are functional
- [ ] Modals open and close properly
- [ ] Form validation works correctly
- [ ] Price calculations are accurate
- [ ] Responsive design works on different screen sizes
- [ ] Dark mode compatibility maintained
- [ ] Cart functionality is intuitive
- [ ] Export features work correctly
- [ ] Performance is not degraded

## 📝 Notes

- Use existing shadcn/ui components where possible
- Maintain consistency with current design language
- Ensure all new features have proper error handling
- Add loading states for async operations
- Include proper TypeScript types
- Write unit tests for complex calculations
- Update documentation after implementation 