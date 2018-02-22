#!/bin/bash
cd $(dirname $0)

while [ true ]; do
        git pull
        pushd modules
        for f in `ls`; do
                pushd $f
                git pull
                popd
        done
        popd
	echo "Initialising up at" $(date)
	npm install
	echo "Starting node..."
	node ./index.js
done

