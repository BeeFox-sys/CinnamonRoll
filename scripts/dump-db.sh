#!/bin/bash

## Usage: ./dump-db.sh

FILENAME=cinnamonrp-db-$(date -u +"%Y-%m-%dT%H-%M-%S")

docker-compose exec -T db mongodump --db CinnamonRP --gzip --out /backup/$FILENAME
docker-compose exec -T db tar cvfz /backup/$FILENAME.tar /backup/$FILENAME
docker-compose exec -T db rm -rf /backup/$FILENAME