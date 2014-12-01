require('../server/log').silence()
chai = require('chai')
chai.should()

sinon = require('sinon')
game = require('../server/game')
level = require('../server/levels').get('maze')

describe 'when a game is created', ->
  gameId = null
  clock = null

  firstPlayer = null
  secondPlayer = null
  firstPlayerMove = null
  secondPlayerMove = null

  beforeEach ->
    firstPlayer = sinon.spy()
    secondPlayer = sinon.spy()
    clock = sinon.useFakeTimers()
    gameId = game.createGame
      level: '/boss/maze'

  afterEach ->
    game.closeGame(gameId)

  it 'should give me a correct id', ->
    game.gameExists(gameId).should.equal(true)

  it 'should not be listed as an open game by default', ->
    game.getAllOpen().length.should.equal(0)

  describe 'before any teams have joined the game', ->

    beforeEach ->
      firstPlayerMove = { gameId: gameId, team: 'glenn', command: 'move', direction: 'left' }
      game.executeTurn(firstPlayerMove, firstPlayer)

    it 'should return false for any team', ->
      firstPlayer.callCount.should.equal(1)
      firstPlayer.firstCall.args[0].should.be.a('string')

  describe 'when no player joins before timeout', ->

    beforeEach ->
      clock.tick(game.PASSIVE_GAME_LIFE_LENGTH)

    it 'should look like the game never existed', ->
      game.gameExists(gameId).should.equal(false)

  describe 'when the first player joins before the timeout', ->


    beforeEach ->

      firstPlayerMove = { gameId: gameId, team: 'glenn', command: 'move', direction: 'left' }
      secondPlayerMove = { gameId: gameId, team: 'ada', command: 'move', direction: 'left' }


      clock.tick((game.PASSIVE_GAME_LIFE_LENGTH) - 10)
      game.joinGame(gameId, 'glenn', firstPlayer)

    it 'should still exist', ->
      game.gameExists(gameId).should.equal(true)

    it 'should wait for the game to be full before calling back', ->
      firstPlayer.callCount.should.equal(0)

    describe 'it starts a new, shorter, timer', ->

      beforeEach ->
        clock.tick((game.PENDING_JOIN_TIMEOUT) - 10)

      it 'should allow a second team to join for another two minutes', ->
        game.gameExists(gameId).should.equal(true)
        game.joinGame(gameId, 'ada', secondPlayer)

      it 'but should only last for 2 minutes', ->
        clock.tick(10)
        game.gameExists(gameId).should.equal(false)

      describe 'when the game has enough players', ->

        beforeEach ->
          game.joinGame(gameId, 'ada', secondPlayer)

        it 'should call back with the first state for both teams', ->
          firstPlayer.callCount.should.equal(1)
          firstPlayer.firstCall.args[1].should.be.an('object')
          secondPlayer.callCount.should.equal(1)
          secondPlayer.firstCall.args[1].should.be.an('object')

        describe 'if nobody is able to provide a turn before turn times out', ->

          beforeEach ->
            clock.tick(game.TURN_TIME_LIMIT)

          it 'should tick a turn', ->
            game.getNumberOfTickedTurns(gameId).should.equal(1);

          describe 'the next time someone executes a turn', ->

            beforeEach ->
              game.executeTurn(firstPlayerMove, firstPlayer)
              clock.tick(game.TURN_TIME_LIMIT)

            it 'the team should have missed a turn', ->
              firstPlayer.callCount.should.equal(2)
              firstPlayer.secondCall.args[1].remainingTurns.should.equal(98)

        describe 'if someone tries to execute a turn twice', ->

          beforeEach ->
            game.executeTurn(secondPlayerMove, secondPlayer)
            game.executeTurn(secondPlayerMove, secondPlayer)
            clock.tick(game.TURN_TIME_LIMIT)

          it 'should not be allowed to do this, but instead get an error message', ->
            secondPlayer.callCount.should.equal(3)
            secondPlayer.secondCall.args[0].should.be.a('string')
            chai.expect(secondPlayer.secondCall.args[1]).to.equal(undefined)
            secondPlayer.thirdCall.args[1].remainingTurns.should.equal(99)

        describe 'when someone ragequits', ->

          beforeEach ->
            for i in [0..99]
              game.executeTurn(firstPlayerMove, firstPlayer);
              clock.tick(game.TURN_TIME_LIMIT)

          it 'should still continue until game over', ->
            firstPlayer.callCount.should.equal(101)
            firstPlayer.lastCall.args[1].isGameOver.should.equal(true)


  describe 'when another open game is created', ->
    games = null
    firstGame = null

    beforeEach ->
      for i in [1..10]
        game.createGame
          level: '/versus/firstblood'
          open: true
          gameId: 'open-' + i
      games = game.getAllOpen()
      firstGame = games[0]

    afterEach ->
      for i in [1..10]
        game.closeGame('open-' + i)

    it 'should be listed as open', ->
      games.length.should.equal(10)

    it 'should have an id property', ->
      for i, g of games
        g.id.should.match(/open-/)

    it 'should have a levelId property', ->
      for i, g of games
        g.levelId.should.equal('/versus/firstblood')

    describe 'when a team joins the game', ->
      gameWithPlayer = null

      beforeEach ->
        game.joinGame('open-1', 'glenn', firstPlayer)
        gameWithPlayer = game.getAllOpen()[0]

      it 'should be readable from the list of open games', ->
        gameWithPlayer.id.should.equal('open-1')
        gameWithPlayer.teams[0].should.equal('glenn')

      describe 'when the team times out', ->

        beforeEach ->
          clock.tick(game.PENDING_JOIN_TIMEOUT)

        it 'should not be open anymore', ->
          game.getAllOpen().length.should.equal(9)

    describe 'when the game is full of teams', ->

      beforeEach ->
        game.joinGame(firstGame.id, 'glenn', firstPlayer)
        game.joinGame(firstGame.id, 'ada', secondPlayer)

      it 'should not be listed in the open list anymore', ->
        game.getAllOpen().length.should.equal(9)


    describe 'when the game dies before anyone joins', ->

      beforeEach ->
        clock.tick(game.PASSIVE_GAME_LIFE_LENGTH)

      it 'should not be open anymore', ->
        game.getAllOpen().length.should.equal(0)


