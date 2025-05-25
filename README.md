# MeetUN API Gateway

This is MeetUN's API Gateway, which uses GraphQL as its means of exposing its API, and is the point that's always called by the frontend when it needs some info from any backend service

## Technology

This Gateway uses a light nodejs server, which creates an Apollo Server instance to create the GraphQL API

## Running locally

You just need to type the following command:

```sh
npm start
```

## Running using Docker

If you want to execute this project using Docker, first build an image with:

```sh
docker build -t <image_name> .
```

Then you can run it with the following command:

```sh
docker run -p 4000:4000 <image_name>
```