FROM node:boron

# Create app directory
WORKDIR /discoball

# use nodemon for development
RUN npm install --global eslint

# use changes to package.json to force Docker not to use the cache
# when we change our application's nodejs dependencies:
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /discoball/

# Bundle app source
COPY . .

RUN chmod -R g-w,o-w .
RUN chmod +x docker/wait-for-it.sh