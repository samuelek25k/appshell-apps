# Quick Notes

Short notes that stay on your computer, with the latest one on your dashboard.

```
appshell dev .            # run it in a development host
appshell package .        # build <id>-<version>.tgz and print its catalog release
```

Release: bump `version` in `manifest.json`, then tag `quick-notes-v<version>` in the apps repository; its workflow packages the app, publishes the release and updates the catalog.
