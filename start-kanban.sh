#!/bin/bash
cd /home/opc/clawd/kanban/.svelte-kit/output/client
exec /home/opc/.nvm/versions/node/v22.22.0/bin/http-server -p 5000 -c-1
