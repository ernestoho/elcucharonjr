# SazónLink — Daily Restaurant Menu & WhatsApp Ordering

SazónLink is a single-page, visually polished restaurant menu link designed for fast ordering via WhatsApp. It presents the restaurant's full menu organized into tabs for Monday through Saturday. Each day tab displays the menu grouped by categories (ESPECIAL, PLATO DEL DÍA, GUARNICIONES, EXTRAS, JUGOS) using clean card layouts and a minimalist design aesthetic with a warm gradient hero. Customers can build orders by selecting dishes with quantities, choosing a guarnición, adding extras and juices, then send a prefilled WhatsApp message to +8097898010 with order details, day, and timestamp. The app is purely frontend-focused, using local state management and integrates seamlessly with WhatsApp Web or mobile app.

[cloudflarebutton]

## Features

- **Daily Menu Tabs**: Intuitive tabs for Monday to Saturday, defaulting to the current day (if within the week) or Monday.
- **Interactive Menu Display**: Categorized menu items with quantity steppers (0-10), hover effects, and accessible controls using shadcn/ui Cards and Tabs.
- **Order Builder**: Single-select for guarniciones, checkboxes with quantities for extras and juices, live-updating sticky summary with subtotal.
- **WhatsApp Integration**: Generates a human-readable, encoded message and opens `wa.me/18097898010` in a new tab/app for seamless ordering.
- **Visual Excellence**: Mobile-first responsive design with smooth micro-interactions (Framer Motion), skeleton loading, and empty states.
- **Accessibility & Polish**: Keyboard navigation, high contrast (≥4.5:1), touch-friendly targets, and toast notifications for feedback.
- **No Backend Required**: All functionality is client-side; menu data is seeded as constants.

## Tech Stack

- **Frontend**: React 18, React Router, TypeScript
- **UI Library**: shadcn/ui (built on Radix UI and Tailwind CSS)
- **Styling**: Tailwind CSS v3 (custom config for minimalist warm theme), clsx, tailwind-merge
- **State Management**: Zustand (optional; uses useState for simplicity)
- **Animations**: Framer Motion (subtle micro-interactions)
- **Icons**: Lucide React
- **Notifications**: Sonner (toasts)
- **Backend/Deployment**: Cloudflare Workers, Hono (routing), Wrangler (CLI)
- **Utilities**: Date-fns, UUID, Zod (validation)
- **Build Tools**: Vite, Bun (package manager)

The project leverages Cloudflare's edge platform for fast, global deployment with no server management.

## Installation

Prerequisites:
- Bun (install from [bun.sh](https://bun.sh))
- Node.js ≥18 (for some dev tools)
- Cloudflare account (for deployment)

1. Clone the repository:
   ```
   git clone <repository-url>
   cd sazonlink
   ```

2. Install dependencies with Bun:
   ```
   bun install
   ```

3. Generate Cloudflare types (if needed):
   ```
   bun run cf-typegen
   ```

The project is pre-configured with shadcn/ui components and Tailwind. No additional setup is required for local development.

## Usage

The app runs as a single-page application at the root route (`/`).

- **Local Preview**: Start the development server:
  ```
  bun run dev
  ```
  Access at `http://localhost:3000` (or the port shown). The menu loads immediately with mock data.

- **Key Interactions**:
  - Select a day tab (Mon-Sat) to view the menu.
  - Use +/- steppers on dishes to set quantities.
  - Choose one guarnición from the dropdown.
  - Toggle extras/juices and adjust quantities.
  - Review the live summary and tap "Order via WhatsApp" to open WhatsApp with a prefilled message like:
    ```
    Order for Monday - [Timestamp]
    Especial: Sancocho de 3 Carnes x1 (375)
    Plato: Pollo Guisado Casero x2 (250 each)
    Guarnición: Arroz Blanco
    Extras: Tostones x1 (100)
    Jugo: Limón x1 (100)
    Total: 1275
    ```

- **Customization**:
  - Edit menu data in `src/components/MenuTabs.tsx` (seeded constants).
  - Modify colors in `tailwind.config.js` (uses RGB values: 243,128,32 for primary orange; 88,52,181 for accents).
  - Adjust WhatsApp number in the order utility (defaults to 18097898010 for DR international format).

## Development

- **Code Structure**:
  - `src/pages/HomePage.tsx`: Main single-page component (rewrite for custom logic).
  - `src/components/ui/*`: Pre-built shadcn/ui components (do not modify; import and compose).
  - `shared/types.ts`: Shared TypeScript types (extend for API if adding backend).
  - `worker/*`: Cloudflare Worker backend (add routes in `user-routes.ts`; do not modify `core-utils.ts` or `index.ts`).
  - `tailwind.config.js`: Custom theme extensions (typography, spacing, animations).

- **Running in Development**:
  ```
  bun run dev
  ```
  Hot-reloads on changes. Use `bun run lint` for code quality checks.

- **Building**:
  ```
  bun run build
  ```
  Outputs to `dist/` for preview or deployment.

- **Testing Locally**:
  - Preview built app: `bun run preview`.
  - WhatsApp links open in browser (test on mobile for app integration).

- **Best Practices**:
  - Use individual Zustand selectors (e.g., `useStore(s => s.count)`) to avoid re-renders.
  - Follow UI non-negotiables: Root wrapper with max-w-7xl, shadcn/ui primitives, Tailwind v3-safe utilities.
  - Ensure responsive design: Mobile-first with breakpoints (sm:640px, md:768px, etc.).
  - Avoid infinite loops: No setState in render; stable deps in useEffect.

For extending with backend (e.g., dynamic menus), add routes in `worker/user-routes.ts` using the IndexedEntity pattern.

## Deployment

Deploy to Cloudflare Workers for global edge delivery. The project is pre-configured with Wrangler.

1. Install Wrangler CLI:
   ```
   bun add -g wrangler
   ```
   Authenticate: `wrangler login`.

2. Configure (optional): Review `wrangler.jsonc` (do not modify bindings or migrations).

3. Deploy:
   ```
   bun run deploy
   ```
   Deploys the Worker and static assets. Access at your Worker URL (e.g., `sazonlink-eyb8bcd4n5t-ktfo3ctkx.your-subdomain.workers.dev`).

[cloudflarebutton]

- **Custom Domain**: Run `wrangler deploy --name sazonlink` and configure in Cloudflare dashboard.
- **Environment Variables**: Add via `wrangler secret put <KEY>` if needed (e.g., for API keys).
- **Preview Deployments**: Use Wrangler's preview feature for branches.

The app is production-ready post-deployment, with automatic HTTPS and global CDN.

## Contributing

1. Fork the repo and create a feature branch.
2. Install deps: `bun install`.
3. Make changes and test locally: `bun run dev`.
4. Lint: `bun run lint`.
5. Commit and push; open a PR.

Follow the code style (ESLint, Prettier via shadcn setup). Focus on visual excellence and mobile UX.

## License

MIT License. See [LICENSE](LICENSE) for details.