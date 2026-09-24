"""Split schema.sql into small parts (supabase/parts/) for SQL editors or clipboards that
cut off long pastes. Statements are never split; comments are dropped to save space.
Usage: python3 split_schema.py"""
import os
import re

LIMIT = 3500
here = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(here, "schema.sql"), encoding="utf-8").read()

stmts, cur, i, in_dollar, in_quote = [], "", 0, False, False
while i < len(s):
    if not in_quote and s.startswith("$$", i):
        in_dollar = not in_dollar
        cur += "$$"
        i += 2
        continue
    c = s[i]
    if not in_dollar and c == "'":
        in_quote = not in_quote
    if not in_dollar and not in_quote and s.startswith("--", i):
        j = s.find("\n", i)
        i = len(s) if j < 0 else j + 1
        continue
    cur += c
    i += 1
    if c == ";" and not in_dollar and not in_quote:
        if cur.strip():
            stmts.append(re.sub(r"\n\s*\n", "\n", cur.strip()))
        cur = ""
assert not cur.strip(), "unterminated statement at end of schema.sql"

parts, buf = [], ""
for st in stmts:
    assert len(st) < LIMIT, f"statement too long for one part ({len(st)} chars): {st[:80]}"
    if buf and len(buf) + len(st) + 2 > LIMIT:
        parts.append(buf)
        buf = ""
    buf += st + "\n\n"
parts.append(buf)

out = os.path.join(here, "parts")
os.makedirs(out, exist_ok=True)
for f in os.listdir(out):
    os.remove(os.path.join(out, f))
for k, p in enumerate(parts, 1):
    with open(os.path.join(out, f"part{k:02d}.sql"), "w", encoding="utf-8") as fh:
        fh.write(f"-- MyWork schema, part {k} of {len(parts)}. Run the parts in order.\n{p}")
print(f"{len(parts)} parts from {len(stmts)} statements:",
      [len(open(os.path.join(out, f'part{k:02d}.sql'), encoding='utf-8').read()) for k in range(1, len(parts) + 1)])
