# EmoStream Hub – R2 Cloud Stream Player & Studio

This package is a responsive web player for public Cloudflare R2 audio and video URLs.

## Included features

- Full-site Firebase Email/Password account gate (all functions are locked before sign-in)
- Primary manager restriction for `hayashirika05@gmail.com`
- Additional Manager Email/Gmail assignment by the primary manager only
- Allowlisted managers must register and sign in with their own verified Firebase password
- Search and genre filters
- Audio and video playback, seek, volume, mute, next/previous, shuffle and repeat
- Favorites and named playlists
- Manager Studio for publishing R2 media URLs
- Computer file upload for audio and video, persisted locally with IndexedDB
- Manager avatar upload from PNG, JPEG, WEBP or GIF files
- Individual media deletion and playlist deletion
- Firestore synchronization with automatic localStorage fallback
- Cyberduck and Cloudflare R2 setup guide

## Quick start

Open `index.html` in Chrome or upload the whole folder to GitHub Pages, Netlify, Firebase Hosting, or another static host.

## Firebase setup

1. Open Firebase Console → Authentication → Sign-in method.
2. Enable **Email/Password** and optionally **Anonymous** sign-in.
3. Create a Firestore database.
4. Deploy the included `firestore.rules` file.
5. Register or sign in as `hayashirika05@gmail.com`.

The site works locally without Firestore, but cloud synchronization and secure shared administration require Firebase Authentication and these Firestore rules.

## Cloudflare R2

Upload media through Cyberduck or the Cloudflare dashboard, enable a public bucket/custom domain, and paste the public file URL into Manager Studio. Never place an R2 Secret Access Key in browser code.
