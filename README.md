### Install
```
npm install
gulp
./script/create-dbs
```

### Add teams
```
./script/add-team "Team Glenn" "Glenn Glenn" glenn@glenn.glenn "Ada Ada" ada@ada.ada
```

### Manual game setup

```
node index.js
curl -H "Content-Type: application/json" -X POST -d '{ "level": "test" }' 127.0.0.1:3000/create
Visit /game/:id
<Post to /game/:id with two bots>
```

### Semi-automatic boss game setup
```
node index.js
node bots/index.js
Visit /boss/:bossId
(Where :bossId should be a key in ./bosses.json)
From browser: Press Start game. Copy gameId.
Run your bot from command line with [teamName apiKey gameId]
<Profit>
```

