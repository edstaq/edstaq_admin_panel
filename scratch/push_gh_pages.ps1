git add -f dist
$tree = (git write-tree --prefix=dist).Trim()
Write-Host "Tree: $tree"
$commit = (git commit-tree $tree -m "Deploy production build to GitHub Pages").Trim()
Write-Host "Commit: $commit"
git push origin "$commit`:refs/heads/gh-pages" --force
git reset HEAD dist
Write-Host "Done pushing gh-pages branch!"
