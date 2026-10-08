#!/usr/bin/env bash
# Публикует собранную папку out/ в ветку gh-pages (GitHub Pages)
set -euo pipefail
cd "$(dirname "$0")/.."
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
cp -R out/. "$TMP"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo deploy)" -c user.email="$(git -C "$OLDPWD" config user.email || echo deploy@local)" commit -q -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REMOTE" gh-pages
rm -rf "$TMP"
echo "Опубликовано: https://saninaalena111-coder.github.io/revital-booking/"
