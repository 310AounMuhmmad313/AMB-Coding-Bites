# AMB Coding Bite — luxury redesign

## Run it
```
npm install
npm run dev        # development
npm run build      # production build (verified)
npm run lint       # 0 warnings, 0 errors on src/
```
No new dependencies were added (package.json is unchanged). Animation is CSS + IntersectionObserver and respects `prefers-reduced-motion`.
Your `node_modules` in the ZIP held Windows-only binaries, so run `npm install` fresh.

## Environment variables
None. Supabase URL + publishable key stay in `src/supabase.js` exactly as before (publishable keys are safe in the frontend; never add a service-role key).

## Edit content in one place
`src/content/siteContent.js` — hero copy, offer badge ($6.99), promises, offers, phone, WhatsApp, address, hours, developer credit.

## Files changed / added
New: `src/content/siteContent.js`, `src/components/ui/{Reveal,PageBanner}.jsx`, `src/Menu.css`, `src/Shop.css`, `src/components/layouts/Cards.css`
Rewritten (UI only): `index.html`, `index.css`, `Header.jsx`, `footer.jsx`, `layouts.jsx`, `HeaderStyle.css`, `Cards.jsx`, `Menu.jsx`, `Cart.jsx`, `Checkout.jsx`, `Login.jsx`, `OrderStatus.jsx`, `Pages/About.jsx`, `Pages/Contact.jsx`, `Pages/InfoPages.css`, `Pages/Home/{Home,Section1-5,Section7}.jsx`, `Pages/Home/HomeStyle.css`, `Admin.css`
Edited (targeted): `Admin.jsx` — added stat counters, a "next step" button per order (calls the same `updateOrder()`), table class. No query/permission/status logic changed.
Removed: `App.css`, `Pages/HomeStyle.css` (unused duplicates), `Section6.jsx` (fake testimonials).
Untouched: `supabase.js`, `CartContext.jsx`, `WishlistContext.jsx`, `main.jsx`, `App.jsx` (routes unchanged).

## Preserved (code paths unchanged)
All Supabase queries (menu `is_available`/`show_on_menu`/`show_on_home` + ordering), checkout insert into `orders` + `order_items` with rollback, login/signup + `?redirect=`, cart/wishlist contexts + localStorage keys, realtime order subscription, admin profile-role check, `updateOrder` status/timer rules (timer starts at `out_for_delivery`), order history modal.

## Behaviour fixes made along the way
- Order page didn't understand `out_for_delivery` / `done` (raw label, 0% progress) — now handled.
- Checkout flashed "Login required" before the session check finished.
- Footer: Instagram/YouTube links lacked `https://`; external URL passed to router `<Link>`; WhatsApp link had no number; phone `tel:` was missing a digit on Contact.
- Removed hotlinked third-party image on About; removed watermarked `hero-2.png` from use.

## NOT verified (please test with your real Supabase)
I had no access to your database/credentials. UI was tested against a mock Supabase client only. Please test: signup/login, placing an order, admin status changes, realtime updates, RLS on `order_items` reads (order page shows items only if allowed).
- **New feedback form** (order page, after delivered/done) writes `rating` + `remark` to `orders` — those columns exist because Admin reads them, but your RLS must allow the customer to update their own order, and a redirect to home follows success. Your upload contained no existing feedback UI to copy.

## Things to confirm / decide
1. Contact form still only shows a success message — it does not send anywhere (EmailJS TODO from the original). Messages are currently lost.
2. Conflicting originals: Contact said "Main Street Food Court, 11AM–11PM, hello@tasteburger.com"; footer said Bobin Village Astore with different hours. I used the footer's. Email is the old placeholder.
3. WhatsApp number assumes Pakistan (+92 355 5578660).
4. Removed because they were placeholders/invented: lorem ipsum, 4 identical fake reviews, app-store badges ("save 20%"), brand-logo carousel, fake phone 999-888-7777, About stats (5+ years, 10k+ orders, 4.8★), invented company history.
5. Not in your codebase, so not added: image *uploads* (admin uses Image URL), a separate deals table, customer order-history page. Offer banners use your existing "free cheese fries" promo + one descriptive banner; edit in siteContent.js.
6. Prices remain in `$` as in your data.
