Fixable errors often seen in uuencoded files.

1. Ends with /^end\n$/ --> last newline may be missing --> rebuild
2. Pre-end with /$[ \`]$/ --> may be missing --> rebuild
3. Data lines --> may have trailing ' ' stripped --> rebuild
