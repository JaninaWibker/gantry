# **retrieve webhook source code**
FROM alpine/git as retrieve-webhook

# TODO: this could be subject to change; might start using git submodules
# clone webhook source
RUN git clone https://github.com/adnanh/webhook /webhook

# **go build stage for webhook**
FROM golang as build-webhook

WORKDIR /webhook

COPY --from=retrieve-webhook /webhook /webhook

# build webhook
RUN go build github.com/adnanh/webhook

# **nodejs build stage**
FROM node:18 as build-harbor

WORKDIR /harbor

# copy files for npm install
COPY package.json       /harbor/package.json
COPY package-lock.json  /harbor/package-lock.json

# install node modules
RUN npm ci

# copy remaining files
COPY . /harbor

# create build
RUN npm run build

# **execution stage**
FROM node:18

WORKDIR /app

# copy over builds
COPY --from=build-webhook /webhook/webhook    /app/runtime/webhook
COPY --from=build-harbor /harbor/dist         /app/dist
COPY --from=build-harbor /harbor/node_modules /app/node_modules

# run harbor
CMD node dist/index.js watch
