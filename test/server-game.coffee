chai = require('chai')
chai.should()

sinon = require('sinon')
game = require('../server/game')
level = require('../server/levels').get('maze')

require('../server/log').silence()


describe 'when a game is created', ->
  gameId = null
  clock = null

  beforeEach ->
    clock = sinon.useFakeTimers()
    gameId = game.createGame
      level: 'maze'

  it 'should give me a correct id', ->
    game.gameExists(gameId).should.equal(true)


  describe 'when no player joins before timeout', ->

    beforeEach ->
      clock.tick(60000 * 10)

    it 'should look like the game never existed', ->
      game.gameExists(gameId).should.equal(false)

  describe 'when the first player joins before the timeout', ->
    firstPlayer = null
    secondPlayer = null
    firstPlayerMove = null
    secondPlayerMove = null


    beforeEach ->
      firstPlayer = sinon.spy()
      secondPlayer = sinon.spy()

      firstPlayerMove = { gameId: gameId, team: 'glenn', command: 'move', direction: 'left' }
      secondPlayerMove = { gameId: gameId, team: 'ada', command: 'move', direction: 'left' }


      clock.tick((60000 * 10) - 10)
      game.joinGame(gameId, 'glenn', firstPlayer)

    it 'should still exist', ->
      game.gameExists(gameId).should.equal(true)

    it 'should wait for the game to be full before calling back', ->
      firstPlayer.callCount.should.equal(0)

    describe 'it starts a new, shorter, timer', ->

      beforeEach ->
        clock.tick((60000 * 2) - 10)

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
            clock.tick(1000)

          it 'should tick a turn', ->
            game.getNumberOfTickedTurns(gameId).should.equal(1);

          describe 'the next time someone executes a turn', ->

            beforeEach ->
              game.executeTurn(firstPlayerMove, firstPlayer)
              clock.tick(1000)

            it 'the team should have missed a turn', ->
              firstPlayer.callCount.should.equal(2)
              firstPlayer.secondCall.args[1].remainingTurns.should.equal(98)

        describe 'if someone tries to execute a turn twice', ->

          beforeEach ->
            game.executeTurn(secondPlayerMove, secondPlayer)
            game.executeTurn(secondPlayerMove, secondPlayer)
            clock.tick(1000)

          it 'should not be allowed to do this, but instead get an error message', ->
            secondPlayer.callCount.should.equal(3)
            secondPlayer.secondCall.args[0].should.be.a('string')
            chai.expect(secondPlayer.secondCall.args[1]).to.equal(undefined)
            secondPlayer.thirdCall.args[1].remainingTurns.should.equal(99)

        describe 'when someone ragequits', ->

          beforeEach ->
            for i in [0..99]
              game.executeTurn(firstPlayerMove, firstPlayer);
              clock.tick(1000)

          it 'should still continue until game over', ->
            firstPlayer.callCount.should.equal(101)
            firstPlayer.lastCall.args[1].isGameOver.should.equal(true)




