#!/bin/bash
cd $(dirname $0)

while [ true ]; do
	echo "Initialising up at" $(date)
	npm install
	echo "Starting node..."
	node ./index.js
done

