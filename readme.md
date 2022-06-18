# Gantry

An **extremely** WIP project for auto updating docker containers upon git events via webhooks.

for local development:
- compile webhook (https://github.com/adnanh/webhook) and copy the executable to runtime/webhook
- start an arbitrary docker container with gantry labels set correctly (enough for early development, later on a docker container which can be rebuilt using docker-compose might be required)
- start webhook (early development, later on gantry will manage this itself)
- set up a webhook on github or gitea (which you can trigger for testing in the best case)
- somehow make your webhook instance reachable from github or giteas end
- run `npm run start`
