# Come Through

Cut in with corrected speech. Private rooms for family priority messages on iPhone.

**Live app:** https://come-through.vercel.app

## Web
```bash
npm install
npm run dev
```

## App Store / TestFlight (Mac + Apple Developer account)
Full instructions: [APP_STORE.md](./APP_STORE.md)

```bash
bash scripts/ios/bootstrap-mac.sh
```

Then in Xcode: select your Team → Archive → Upload to App Store Connect.

- Bundle ID: `app.comethrough.family`
- Privacy: https://come-through.vercel.app/privacy
- Support: https://come-through.vercel.app/support
