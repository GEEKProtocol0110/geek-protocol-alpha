# Two processes are REQUIRED in production.
#
# The API does not process payouts — it only enqueues them. If you run `web`
# alone, every reward sits in Redis forever and no player is ever paid.
#
# Railway/Heroku/Render read this file. On platforms that don't, define both
# commands manually as separate services.
web: cd apps/api && npm run start
worker: cd apps/api && npm run worker
