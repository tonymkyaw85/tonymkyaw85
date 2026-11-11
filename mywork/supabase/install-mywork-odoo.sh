#!/usr/bin/env bash
# Installs (or updates) the mywork-odoo Edge Function on a self-hosted Supabase server.
#
# Run on the machine that runs Supabase:
#   curl -fsSL https://raw.githubusercontent.com/tonymkyaw85/tonymkyaw85/claude/new-session-n30vcr/mywork/supabase/install-mywork-odoo.sh -o install-mywork-odoo.sh
#   sudo bash install-mywork-odoo.sh            # finds the Supabase folder by itself
#   sudo bash install-mywork-odoo.sh /path/to/supabase/docker
#
# It downloads the function, asks for the Odoo API key (typed hidden, checked against Odoo),
# adds the settings to .env and docker-compose.yml (backups are kept), restarts the
# functions container and checks the function answers. Safe to run again to update.
set -euo pipefail

SRC=${MYWORK_SRC:-https://raw.githubusercontent.com/tonymkyaw85/tonymkyaw85/claude/new-session-n30vcr/mywork/supabase/functions/mywork-odoo}
ODOO_URL_DEFAULT=https://edpn.odoo.com
ODOO_DB_DEFAULT=edpn
ODOO_COMPANY_DEFAULT=1
TZ_DEFAULT=Asia/Singapore
VARS="ODOO_URL ODOO_DB ODOO_API_KEY ODOO_COMPANY_ID MYWORK_TIMEZONE MYWORK_ALLOWED_ORIGINS"

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }
ok() { printf '  \033[32m✔\033[0m %s\n' "$*"; }
die() { printf '\n\033[31m✘ %s\033[0m\n' "$*" >&2; exit 1; }
ask() { local a; read -r -p "  $1 " a </dev/tty || true; printf '%s' "$a"; }

command -v curl >/dev/null || die "curl is not installed."
command -v docker >/dev/null || die "docker is not installed (or not in PATH). On Synology, run this with sudo."
if docker compose version >/dev/null 2>&1; then DC="docker compose"
elif command -v docker-compose >/dev/null; then DC="docker-compose"
else die "Neither 'docker compose' nor 'docker-compose' works."; fi

# 1. Find the Supabase docker folder.
say "1/6 Finding your Supabase folder"
DIR=${1:-}
if [ -z "$DIR" ]; then
  mapfile -t FOUND < <(find /volume* /opt /srv /root /home /var/services 2>/dev/null -maxdepth 6 \
      \( -name '@*' -o -name '#recycle' -o -name node_modules -o -name .git -o -name proc \) -prune -o \
      -name 'docker-compose.y*ml' -print 2>/dev/null | xargs -r grep -l 'supabase/edge-runtime' 2>/dev/null | xargs -r -n1 dirname | sort -u)
  if [ ${#FOUND[@]} -eq 0 ]; then die "Couldn't find it. Run again with the folder, e.g.: sudo bash $0 /volume1/docker/supabase/docker"
  elif [ ${#FOUND[@]} -eq 1 ]; then DIR=${FOUND[0]}
  else
    echo "  Found more than one:"; for i in "${!FOUND[@]}"; do echo "    $((i + 1))) ${FOUND[$i]}"; done
    n=$(ask "Which one? [1-${#FOUND[@]}]"); DIR=${FOUND[$((n - 1))]:-} ; [ -n "$DIR" ] || die "No folder chosen."
  fi
fi
DIR=${DIR%/}
COMPOSE=$(ls "$DIR"/docker-compose.yml "$DIR"/docker-compose.yaml 2>/dev/null | head -1 || true)
[ -n "$COMPOSE" ] || die "No docker-compose.yml in $DIR"
[ -f "$DIR/.env" ] || die "No .env in $DIR"
grep -q 'supabase/edge-runtime' "$COMPOSE" || die "$COMPOSE has no Edge Functions service (supabase/edge-runtime)."
FUNCS="$DIR/volumes/functions"
[ -d "$FUNCS" ] || die "Missing $FUNCS"
ok "$DIR"

envget() { grep -E "^$1=" "$DIR/.env" | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true; }

# 2. Download the function.
say "2/6 Downloading the mywork-odoo function"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
for f in index.ts hr.ts odoo.ts; do
  curl -fsSL "$SRC/$f" -o "$TMP/$f" || die "Download failed: $SRC/$f"
  grep -q 'mywork\|Odoo\|odoo' "$TMP/$f" || die "Unexpected content in $f"
done
STAMP=$(date +%Y%m%d-%H%M%S)
if [ -d "$FUNCS/mywork-odoo" ]; then cp -a "$FUNCS/mywork-odoo" "$TMP/previous"; fi
mkdir -p "$FUNCS/mywork-odoo"
cp "$TMP"/index.ts "$TMP"/hr.ts "$TMP"/odoo.ts "$FUNCS/mywork-odoo/"
chmod 644 "$FUNCS/mywork-odoo/"*.ts
ok "Saved to $FUNCS/mywork-odoo"

# 3. Settings, with the API key checked against Odoo.
say "3/6 Odoo settings"
ODOO_URL=$(envget ODOO_URL); ODOO_URL=${ODOO_URL:-$ODOO_URL_DEFAULT}
ODOO_DB=$(envget ODOO_DB); ODOO_DB=${ODOO_DB:-$ODOO_DB_DEFAULT}
ODOO_COMPANY_ID=$(envget ODOO_COMPANY_ID); ODOO_COMPANY_ID=${ODOO_COMPANY_ID:-$ODOO_COMPANY_DEFAULT}
MYWORK_TIMEZONE=$(envget MYWORK_TIMEZONE); MYWORK_TIMEZONE=${MYWORK_TIMEZONE:-$TZ_DEFAULT}
ODOO_API_KEY=$(envget ODOO_API_KEY)
echo "  Odoo: $ODOO_URL (database $ODOO_DB, company $ODOO_COMPANY_ID)"
check_key() {
  curl -sS -m 30 -X POST "$ODOO_URL/json/2/res.company/search_read" -H "Authorization: bearer $1" \
    -H "X-Odoo-Database: $ODOO_DB" -H "Content-Type: application/json" \
    -d "{\"domain\":[[\"id\",\"=\",$ODOO_COMPANY_ID]],\"fields\":[\"name\"]}" 2>/dev/null || true
}
while :; do
  if [ -n "$ODOO_API_KEY" ]; then prompt="Odoo API key (press Enter to keep the saved one):"; else prompt="Paste the Odoo API key (finance_clerk) — it won't show on screen:"; fi
  read -r -s -p "  $prompt " k </dev/tty || true; echo
  [ -n "$k" ] && ODOO_API_KEY=$k
  [ -n "$ODOO_API_KEY" ] || { echo "  A key is needed."; continue; }
  r=$(check_key "$ODOO_API_KEY")
  case "$r" in
    '[{"id": '*|'[{"id":'*) ok "Key works: $(printf '%s' "$r" | sed -E 's/.*"name": ?"([^"]*)".*/\1/')"; break ;;
    '[]') die "The key works but can't see company $ODOO_COMPANY_ID. Check the user's allowed companies." ;;
    *) echo "  ✘ Odoo didn't accept that key. Try again (Ctrl+C to stop)."; ODOO_API_KEY="" ;;
  esac
done
ORIG=$(envget MYWORK_ALLOWED_ORIGINS)
echo "  Which web address will MyWork be opened from? e.g. https://mywork.example.com"
o=$(ask "App address (Enter for ${ORIG:-* = any, change once the app is hosted}):")
MYWORK_ALLOWED_ORIGINS=${o:-${ORIG:-*}}

# 4. Write .env (backup kept).
say "4/6 Saving settings to .env"
cp -p "$DIR/.env" "$DIR/.env.bak-mywork-$STAMP"
grep -vE "^# MyWork \(mywork-odoo function\)$|^($(echo $VARS | tr ' ' '|'))=" "$DIR/.env.bak-mywork-$STAMP" > "$TMP/env" || true
{ cat "$TMP/env"; if [ -s "$TMP/env" ] && [ -n "$(tail -c1 "$TMP/env")" ]; then echo; fi
  echo "# MyWork (mywork-odoo function)"
  for v in $VARS; do printf '%s=%s\n' "$v" "${!v}"; done; } > "$DIR/.env"   # same file: keeps owner and permissions
ok ".env updated (backup: .env.bak-mywork-$STAMP)"

# 5. Pass the settings to the functions container.
say "5/6 Connecting the settings to the functions container"
if grep -q 'ODOO_API_KEY' "$COMPOSE"; then ok "docker-compose already has them"
else
  cp -p "$COMPOSE" "$COMPOSE.bak-mywork-$STAMP"
  awk -v vars="$VARS" '
    function indent(s) { match(s, /^ */); return RLENGTH }
    BEGIN { n = split(vars, V, " ") }
    {
      lines[NR] = $0
    }
    END {
      svc = 0; for (i = 1; i <= NR; i++) if (lines[i] ~ /^[ ]+functions:[ ]*$/ && indent(lines[i]) == 2) { svc = i; break }
      if (!svc) exit 3
      env = 0
      for (i = svc + 1; i <= NR; i++) {
        if (lines[i] ~ /^[ ]*[^ #]/ && indent(lines[i]) <= 2) break
        if (lines[i] ~ /^[ ]+environment:[ ]*$/ && indent(lines[i]) == 4) { env = i; break }
      }
      if (!env) exit 4
      list = 0; ind = 6
      for (j = env + 1; j <= NR; j++) if (lines[j] ~ /^[ ]*[^ #]/) { ind = indent(lines[j]); if (lines[j] ~ /^[ ]*- /) list = 1; break }
      pad = sprintf("%" ind "s", "")
      for (i = 1; i <= NR; i++) {
        print lines[i]
        if (i == env) {
          print pad "# MyWork (mywork-odoo function)"
          for (k = 1; k <= n; k++) print pad (list ? "- " V[k] "=${" V[k] "}" : V[k] ": ${" V[k] "}")
        }
      }
    }' "$COMPOSE.bak-mywork-$STAMP" > "$TMP/compose" || die "Couldn't find the functions service's environment: in $COMPOSE. Nothing was changed there."
  cat "$TMP/compose" > "$COMPOSE"
  ok "Added to $(basename "$COMPOSE") (backup: $(basename "$COMPOSE").bak-mywork-$STAMP)"
fi
(cd "$DIR" && $DC config -q) || { cp -p "$COMPOSE.bak-mywork-$STAMP" "$COMPOSE" 2>/dev/null || true; die "docker compose rejected the file; the original was put back."; }

# 6. Restart and test.
say "6/6 Restarting the functions container and testing"
(cd "$DIR" && $DC up -d --force-recreate functions) || die "Restart failed."
up=0
for i in $(seq 1 30); do
  if (cd "$DIR" && $DC exec -T functions true) >/dev/null 2>&1; then up=1; break; fi
  sleep 2
done
[ "$up" = 1 ] || die "The functions container isn't staying up. See why: cd $DIR && $DC logs --tail 50 functions"
for v in ODOO_URL ODOO_DB ODOO_COMPANY_ID ODOO_API_KEY; do
  (cd "$DIR" && $DC exec -T functions sh -c "test -n \"\$$v\"") >/dev/null 2>&1 || die "$v didn't reach the functions container."
done
ok "Settings reached the container"
PORT=$(envget KONG_HTTP_PORT); PORT=${PORT:-8000}
ANON=$(envget ANON_KEY)
res=""
for i in $(seq 1 30); do
  res=$(curl -sS -m 10 -X POST "http://localhost:$PORT/functions/v1/mywork-odoo" -H "Authorization: Bearer $ANON" \
        -H "apikey: $ANON" -H "Content-Type: application/json" -d '{"action":"load"}' 2>/dev/null || true)
  case "$res" in *'"error"'*) break ;; esac
  sleep 2
done
case "$res" in
  *'Please sign in'*)   # the function's own answer to a request without a signed-in user
    ok "The function is running (it answered: $res)"
    say "Done. MyWork can now reach Odoo through https://<your-supabase>/functions/v1/mywork-odoo"
    [ "$MYWORK_ALLOWED_ORIGINS" = "*" ] && echo "  Once the app has its own web address, run this again and enter it as the app address."
    exit 0 ;;
  *) echo "  The function didn't answer as expected: ${res:-no answer}"
     echo "  Logs: cd $DIR && $DC logs --tail 50 functions"; exit 1 ;;
esac
