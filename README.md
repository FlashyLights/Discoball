# Discoball
Open source Discord chat bot for communities

## Easy Start

1. Clone the repo
2. Copy `conf/bot.default.json` to `conf/bot.json`
3. Edit the config, making sure to insert a Discord Bot Token
4. Start the bot with `./run.sh`

By itself the bot will run but won't have any functionality. Read on to add some modules.

## Adding Modules

Discoball is designed around modules, meaning each can be customised. To start with, we're going to download the default and API modules.

1. `cd modules/`
2. Download the default module, with `git checkout github.com/FlashyLights/Discoball-default default`
3. Download the api module, with `git checkout github.com/FlashyLights/Discoball-API api`

The modules will now load when the bot is next restarted, but you'll likely need to add some new config items to make the most of them. Most modules will tell you in their README which lines need adding.

4. Edit `conf/bot.json` and find the line `"moduleConfigs": {}`. Edit this line to add the new config values:
```
"moduleConfigs": {
    "api": {
        "port": 3000
    }
}
````
5. Restart the bot to load the new modules

## Docker

We've included a Dockerfile and docker-compose.yml that are mostly used for development, but they can be used in production if you want!

## Writing Modules

Coming soon!
