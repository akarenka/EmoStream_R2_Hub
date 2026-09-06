EmoStream Media Dashboard v6

New features
- Home page displays synchronized uploaded-media totals.
- Separate Video and Audio counters.
- Last Firestore synchronization time and Cloud synced status.
- New Media Manager / Your Media page inspired by a creator video dashboard.
- Search and filter uploaded media by video or audio.
- Media table includes thumbnail, title, creator, type, publish date, source and actions.
- Play, Share and Remove controls are available from the management table.
- The sidebar badge updates automatically from the Firestore songs collection.

All previous functions remain, including playlists, repeat-all, uploads,
Cloudflare R2, Firebase, synchronized overlay ads, manager accounts, avatar,
sharing, delete/remove without deleting cloud originals, and no-right-click
media protection.

Deployment
1. Replace the website index.html with the index.html in this package.
2. Keep or publish the included combined firestore.rules.
3. Redeploy and press Ctrl+F5.
4. Confirm that the header shows MEDIA DASHBOARD v6.
