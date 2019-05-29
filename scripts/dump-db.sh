<<<<<<< current
#!/bin/bash

## Usage: ./dump-db.sh


docker-compose exec -T db mongodump --db CinnamonRoll --gzip --out /backup/$FILENAME
docker-compose exec -T db tar cvfz /backup/$FILENAME.tar /backup/$FILENAME
=======
#!/bin/bash

## Usage: ./dump-db.sh

FILENAME=CinnamonRoll-db-$(date -u +"%Y-%m-%dT%H-%M-%S")

docker-compose exec -T db mongodump --db CinnamonRoll --gzip --out /backup/$FILENAME
docker-compose exec -T db tar cvfz /backup/$FILENAME.tar /backup/$FILENAME
>>>>>>> before discard
docker-compose exec -T db rm -rf /backup/$FILENAME