# World Clock

Local times for the cities you work with, on a page and on your dashboard.

```
appshell dev .            # run it in a development host
appshell package .        # build <id>-<version>.tgz and print its catalog release
```

Release: bump `version` in `manifest.json`, then tag `world-clock-v<version>` in the apps repository; its workflow packages the app, publishes the release and updates the catalog.
