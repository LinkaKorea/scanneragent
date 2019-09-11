#!/bin/bash

pm2 restart ecosystem.config.js --env dev --only scanneragent

pm2 logs scanneragent