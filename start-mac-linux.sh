#!/bin/sh
cd "$(dirname "$0")"
printf 'Откройте http://localhost:8000 в браузере\n'
python3 -m http.server 8000
