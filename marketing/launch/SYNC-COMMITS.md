# Sync unpushed launch commits

GitHub `master` is at `0ee6d5b`. This cloud session is **7+ commits** ahead (launch tooling, videos, audit scripts, middleware fix for public MP4s).

## Option A — git bundle (one file, no cloud push needed)

If the cloud agent created `getdozen-launch.bundle`:

```bash
# copy bundle into repo root, then:
chmod +x scripts/apply-launch-bundle.sh
./scripts/apply-launch-bundle.sh getdozen-launch.bundle
npm run launch:prep
git push origin master
```

## Option B — one command (if already synced)

```bash
./scripts/push-launch.sh
```

## Option C — push from your laptop manually

If your local clone is up to date with GitHub:

```bash
git pull origin master
# cherry-pick or merge from this cloud session's branch if you have access
git push origin master
```

## Option D — clone from Origin (canonical private repo)

```bash
origin auth login
origin repo clone lukakasalo96/getdozen-platform
# copy marketing/ and scripts/ from this session if needed
git push origin master
```

## Option E — apply on GitHub via web

Upload these paths from this session manually if push fails:

- `marketing/dozen-launch-preview.mp4`
- `marketing/dozen-launch-horizontal.mp4`
- `public/marketing/waitlist/*.png`
- `scripts/` launch tooling
- `marketing/launch/*.md`

## Verify after push

```bash
npm run launch:prep
```

Vercel auto-deploys `master` → getdozen.dev.
