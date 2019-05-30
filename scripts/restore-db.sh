#!/bin/bash

## Usage: ./restore-db.sh <archive filename without extension>

FILENAME=$1

docker-compose -f "$(dirname $0)/../docker-compose.yml" exec -T db tar xvf /backup/$FILENAME.tar -C /
docker-compose -f "$(dirname $0)/../docker-compose.yml" exec -T db mongorestore --gzip --db CinnamonRoll "/backup/$FILENAME/CinnamonRoll"
docker-compose -f "$(dirname $0)/../docker-compose.yml" exec -T db rm -rf /backup/$FILENAME