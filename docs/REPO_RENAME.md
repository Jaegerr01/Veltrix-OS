# Renaming the GitHub repository to PostelOS

The code, package metadata (`package.json` name + repository URL) and docs already say **PostelOS**.
The GitHub remote still points at the old slug and was intentionally NOT touched (no push, no remote change).

Barry, to finish the rename:

1. GitHub -> the repository (currently `Jaegerr01/Veltrix-OS`) -> **Settings** -> General -> *Repository name* -> `PostelOS` -> **Rename**.
   (GitHub keeps redirects from the old URL, so existing clones keep working for a while.)
2. In your local clone run:

   ```
   git remote set-url origin https://github.com/Jaegerr01/PostelOS.git
   git remote -v
   ```
3. If the repo is connected to Netlify, open Site settings -> Build & deploy -> Continuous deployment -> *Link to a different repository* (or re-authorise) so deploys follow the new name.
4. Optional: rename the local folder `veltrix-command-os` to `PostelOS` (close editors/dev servers first).

`gh` (GitHub CLI) is not installed on this machine, so nothing was renamed automatically.
