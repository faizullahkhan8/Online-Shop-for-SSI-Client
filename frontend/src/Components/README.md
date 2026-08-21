# Atomic Design Structure

To ensure the pharmacy app remains scalable and its components highly reusable across different verticals (Medicines, Cosmetics, Optics, Lab Tests), we are adopting an **Atomic Design** approach for all new and refactored components.

## Directory Guide

1. **`atoms/`**: The most basic, indivisible UI components. They cannot be broken down further without losing their meaning.
   - *Examples:* Buttons, Inputs, Labels, Spinners, Icons.
   - *Migration:* Move files from `src/UI` (e.g., `Button.jsx`, `Input.jsx`) here as time permits.

2. **`molecules/`**: Groups of two or more atoms functioning together as a simple unit.
   - *Examples:* Search bars (Input + Button), Form Fields (Label + Input + Error Message), Product Rating (Stars + Number).
   - *Migration:* Move `StarRating.jsx`, `Breadcrumb.jsx` here.

3. **`organisms/`**: Relatively complex, distinct sections of an interface consisting of groups of molecules and/or atoms.
   - *Examples:* Headers, Footers, Product Cards, Cart Summary, Modals.
   - *Migration:* Move `ProductCard.jsx`, `LexicalEditor.jsx`, `CancellationModal.jsx` here.

4. **`templates/`**: Page-level objects that place components into a layout and articulate the design's underlying content structure. (Often reusable layouts).
   - *Examples:* `AdminDashboardLayout`, `MainUserLayout`.

*Note: Please update imports (e.g., `import Button from '../../UI/Button'`) across the application whenever migrating these files.*
