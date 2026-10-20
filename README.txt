mikella.xyz, copied off Adobe Portfolio
=======================================

This folder is the whole site: 18 pages, their original styling, and every image
(about 1,385 files, all sizes the old site used). Nothing in it depends on Adobe
Portfolio's servers except the items listed under "Still on Adobe" below.

Pages
  index.html / work.html     home with the category covers
  photos.html                photo categories
  fashion-photography.html, commercial-photography.html, club-culture.html,
  experimental.html, portraits.html, skate.html (Still Life), lagos-1.html
  filmmaking.html, motion.html (Films), creative-direction.html, features.html,
  a-r-t.html (3D), modeling.html, submissions.html, contact.html

The page addresses stay the same as before (mikella.xyz/photos, /filmmaking and so on),
so old links people have saved keep working.

Putting it online (Cloudflare Pages, free)
  1. Sign in at dash.cloudflare.com
  2. Workers & Pages > Create > Pages > Upload assets
  3. Name the project (for example mikella-xyz) and drag this whole folder in
  4. Check the preview link it gives you
  5. Custom domains > add mikella.xyz, then follow Cloudflare's steps for GoDaddy
     Adobe stays live until the switch finishes, so there is no downtime.
  Cancel Adobe Portfolio only once the new site has been live and checked.

Still on Adobe (to sort before cancelling Portfolio)
  - Fonts: the site loads its fonts from the Adobe Fonts kit that Portfolio provides.
    They will keep working while Portfolio is active. Before cancelling, the same
    fonts need to be added to a web project in your own Adobe Fonts account
    (included with Creative Cloud) or swapped for close matches.
  - Videos: the home page background video and the clips uploaded straight to Adobe
    (Gucci, Sorbé, Studio Tuut, KFC, Finale, Cococulotte and others, about 20) still
    play from Adobe's video server. YouTube and Vimeo videos are not affected.
  - Contact and Submissions forms: these now open the visitor's email app addressed
    to contact@mikella.studio. To receive submissions directly, create a free form at
    formspree.io and paste its address into FORM_ENDPOINT at the top of
    assets/js/site.js.

Analytics: the same Google Analytics ID as before (G-QCECGVCCVS) is kept on every page.
