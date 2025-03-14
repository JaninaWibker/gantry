# **retrieve webhook source code**
FROM alpine/git as retrieve-webhook

# clone webhook source
RUN git clone https://github.com/adnanh/webhook /webhook

# **go build stage for webhook**
FROM golang as build-webhook

WORKDIR /webhook

COPY --from=retrieve-webhook /webhook /webhook

# build webhook
RUN go build github.com/adnanh/webhook

# **nodejs build stage**
FROM node:18 as build-gantry

WORKDIR /gantry

# copy files for npm install
COPY package.json       /gantry/package.json
COPY package-lock.json  /gantry/package-lock.json

# install node modules
RUN npm ci

# copy remaining files
COPY . /gantry

# create build
RUN npm run build

# remove all devDependencies as they aren't needed at runtime
RUN rm -rf node_modules
RUN npm ci --omit=dev

# **execution stage**
FROM gcr.io/distroless/nodejs:18

WORKDIR /app

# copy over builds
COPY --from=build-webhook /webhook/webhook    /app/runtime/webhook
COPY --from=build-gantry /gantry/dist         /app/dist
COPY --from=build-gantry /gantry/node_modules /app/node_modules

# run gantry
CMD ["dist/index.js", "watch"]
