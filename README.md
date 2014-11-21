### Install
```
npm install
gulp
./script/create-dbs
```

### Add teams
```
ssh monkeymusic@warmup.monkeymusicchallenge.com
cd mmc
./script/add-team "Team Glenn" "Glenn Glenn" glenn@glenn.glenn "Ada Ada" ada@ada.ada
```

### Setup

```
node index.js
Visit /game/new (redirects to /game/:id)
<Post to /game/:id with two bots>
```

### Semi-automatic boss game setup
```
node index.js
node bots/index.js
Visit /boss/:bossId
(Where :bossId should be a key in ./bosses.json)
From browser: Copy gameId.
Run your bot from command line with [teamName apiKey gameId]
<Profit>
```

