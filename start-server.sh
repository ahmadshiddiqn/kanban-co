#!/bin/bash
cd /home/opc/clawd/kanban/build
export PORT=3000
exec /home/opc/.nvm/versions/node/v22.22.0/bin/node index.js >> /tmp/kanban-prod.log 2>&1
