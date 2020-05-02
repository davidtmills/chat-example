(function() {

var Game = function (application, configKey, state) {
  //store a private reference to the application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
  var _cards = {};
  var _stacks = {};
  var _config = {
    id:"",
    title:"",
    description:"",
    rules:"",
    css:"",
    buyIn:0,
    bidPrompt:"",
    trumps:[],
    chat:[],
    gameMenu:[],
    decks:{ full:1 },
    initUp:0,
    initDown:0,
    options:{
      handStack:"hand",
      drawStack:"deck",
      discardStack:"discard",
      playStack:"shared",
      trickStack:"discard",
      bidRounds:2,
      minBid:0,
      maxBid:0,
      buyIn:1000,
      maxBuyIns:1,
      minBet:0,
      maxBet:100,
      maxRaise:100,
      bigBlind:1,
      smallBlind:.5 },
    display:[["*[area='p1']","hand","owner"],["*[area='t1']","deck","everyone"],["*[area='t1']","discard","everyone"],["*[area='t1']","shared","everyone"],["*[area='t2']","hand","everyone"]]
  }
  _config = Object.assign(_config, typeof (configKey === "string") ? _app.gameConfigs[configKey] : configKey );

  //define private config variable to hold property values
  var _var = {
    key:_app.randomCode(8, "G"),
    mode:"",
    trump:"",
    bid:0,
    upCard:{ key:"", stack:"", turnedDown:false },
    players:[ new Player(_app, { key:_app.user.key, name:_app.user.name }) ],
    dealerKey:_app.user.key,
    activeKey:_app.user.key,
    highKey:"",
    configKey:_config.id,
    lastUpdate:Date.now(),
    lastRefresh:0
  };
  //update with state data if passed
  if (typeof state === "object") {
    //_var = _app.updateProperty(_var, state);
  }

  /****** STATE AN UI MANAGEMENT ******/
  Object.defineProperty(this,"toJSON",{
    value:function() {
      return this.state;
    },
    enumerable: false
  });

  Object.defineProperty(this,"state",{
    get: function() {
      var obj = {
        key:_var.key,
        mode:_var.mode,
        trump:_var.trump,
        bid:_var.bid,
        upCard:_var.upCard,
        players:_var.players,
        dealerKey:_var.dealerKey,
        activeKey:_var.activeKey,
        highKey:_var.highKey,
        configKey:_var.configKey,
        lastUpdate:_var.lastUpdate,
        cardState:Object.values(_cards).map((v) => v.state),
        stackState:Object.values(_stacks).map((v) => v.state)
      }
      return obj;
    },
    set: function(value) {
      console.log("game.state", value);
      //var prop = _var;
      //var cards = _cards;
      //var stacks = _stacks;
      var isDirty = false;

      //todo: Maybe add check to make sure new lastUpdate is higher than current
      //and if not ignore the update

      //Now update any other property states
      for (var k in value) {
        switch (k) {
          case "cardState":
            //Apply Card states, could be none, some or all cards
            //we are non-destructive to unspecified cards
            if (Array.isArray(value["cardState"])) {
              value.cardState.forEach((v) => {
                if (typeof _cards[v.key] === "object") {
                  _cards[v.key].state = v;
                }
              })
            }
            break;
          case "stackState":
            //Apply Stack states, could be none, some or all stacks
            //we are non-destructive to unspecified stacks
            if (Array.isArray(value["stackState"])) {
              value.stackState.forEach((v) => {
                if (typeof _stacks[v.key] === "object") {
                  _stacks[v.key].state = v;
                }
              });
            }
            break;
          case "playerState":
            //Apply Player states, could be none, some or all cards
            //we are non-destructive to unspecified players
            if (Array.isArray(value["playerState"])) {
              isDirty = true;
              value.playerState.forEach((ps) => {
                var p = ps;
                var idx = _var.players.findIndex((v) => (v.key == p.key));
                if (idx == -1) {
                  //add a new player item
                  _var.players.push(p)
                } else {
                  //extend the existing player item
                  _var.players[idx] = Object.assign({}, _var.players[idx], p);
                }
              })
            }
            break;
          default:
            if ((typeof _var[k] !== "undefined") && (_var[k] !== value[k])) {
              isDirty = true;
              _var[k] = value[k];
            }
            break;
        }
      }

      if (!_app.ready) {
        //if _app.ready is false then we need to initialize the UI
        _app.ready = true;
        this.lastUpdate = Date.now();
        this.gamearea();
        this.refreshUI(true);
      } else if ((isDirty) && (typeof value.lastUpdate !== "number")) {
        //make sure lastUpdate is updated if not specified in state
        //and any game-level properties were changed
        _var.lastUpdate = Date.now();
      }

    },
    enumerable: false
  });

  Object.defineProperty(this,"lastUpdate",{
    get: function() { return (typeof _var.lastUpdate == "number") ? _var.lastUpdate : 0 },
    set: function(pushState) {
      _var.lastUpdate = Date.now();
      //if (_app.ready === false) { return; }
      var socket = (_app.key === "SERVER") ? _app.io.to(_var.key) : _app.io;
      switch (typeof pushState) {
        case "object":
          socket.emit("state", "game", _var.key, pushState);
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState) {
            socket.emit("state", "game", _var.key, this.state);
          }
          break;
        default:
          warn("Invalid type (" + typeof pushState + ") lastUpdate", pushState);
          break;
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"lastRefresh",{
    get: function() { return (typeof _var.lastRefresh == "number") ? _var.lastRefresh : 0 },
    enumerable: false
  });

  Object.defineProperty(this,"refreshUI",{
    value:function(refreshAll) {
      console.log('game.refreshUI');
      if (!_app.ready) {  return; }
      var k;
      var after = _var.lastRefresh;
      var before = Date.now();
      var forceRefresh = (refreshAll === true);
      _var.lastRefresh = before;
      //each stack will call to refresh card state of each of its cards
      for (k in _stacks) {
        _stacks[k].refreshUI(forceRefresh);
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"key",{
    get: function() { return _var.key; },
    set: function(value) { _var.key = value; },
    enumerable: false
  });

  Object.defineProperty(this,"seats",{
    get: function() {
      var seats = [];
      var maxPlayers = (typeof _config.maxPlayers === "number") ? _config.maxPlayers : 4;
      //get all users in the room so we can add new players to empty seats
      var users = ((typeof _app.room === "object") && (typeof _app.room.users === "object")) ? Object.values(_app.room.users).map((v) => ({ key:v.key, name:v.name })) : [];
      //remove existing players from the list of available users
      users = users.filter((v) => (typeof _app.game.getPlayer(v.key) !== "object"));
      for (var x = 0; x < maxPlayers; x++) {
        var seat = { index:x, position:(x + 1), key:"", name:"", folded:true };
        if (_var.players.length > x) {
          console.log(_var.players[x]);
          seat = Object.assign(seat, _var.players[x]);
        } else if (users.length > 0) {
          seat = Object.assign(seat, users.pop());
        }
        seats.push(seat);
      }
      return seats;
    },
    enumerable: false
  });

  Object.defineProperty(this,"mode",{
    get: function() { return _var.mode; },
    set: function(value) {
      if ((typeof value === "string") && (_var.mode !== value)) {
        _var.mode = value;
        _var.lastUpdate = { mode:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"trump",{
    get: function() {
      return _var.trump;
    },
    set: function(value) {
      if ((typeof value === "string") && (_var.trump !== value)) {
        _var.trump = value;
        _var.lastUpdate = { trump:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"bid",{
    get: function() {
      return _var.bid;
    },
    set: function(value) {
      if ((typeof value === "string") && (_var.bid !== value)) {
        _var.bid = value;
        _var.lastUpdate = { bid:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"upCard",{
    get: function() {
      return this.getCard(_var.upCardKey);
    },
    set: function(value) {
      var newCardKey = (typeof value === "object") ? value.key : (typeof value === "string") ? value : "";
      if (_var.upCardKey !== newCardKey) {
        _var.upCardKey = value;
        _var.lastUpdate = { upCardKey:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"display",{
    get: function() {
      return (Array.isArray(_config["display"])) ?  _config.display : [["*[area='p1']","hand","owner"],["*[area='t1']","deck","everyone"],["*[area='t1']","discard","everyone"],["*[area='t1']","shared","everyone"],["*[area='t2']","hand","everyone"]];
    },
    enumerable: false
  });

  Object.defineProperty(this,"title",{
    get: function() { return (typeof _config.title == "string") ? _config.title : ""; },
    enumerable: false
  });

  Object.defineProperty(this,"description",{
    get: function() { return (typeof _config.description == "string") ? _config.description : ""; },
    enumerable: false
  });

  Object.defineProperty(this,"rules",{
    get: function() { return (typeof _config.rules == "string") ? _config.rules : ""; },
    enumerable: false
  });

  Object.defineProperty(this,"css",{
    get: function() { return (typeof _config.css == "string") ? _config.css : ""; },
    enumerable: false
  });

  Object.defineProperty(this,"trumps",{
    get: function() { return (typeof _config.trumps == "object") ? _config.trumps : []; },
    enumerable: false
  });

  Object.defineProperty(this,"players",{
    get: function() {
      //return the actual player object for each key in the array
      return _var.players;
    },
    set: function(value) {
      //Accepts eithe array of playerKeys or player objects and converts to array of playerKeys
      if ((_var.players !== value) && (Array.isArray(value))) {
        _var.players = value;
        _var.lastUpdate = { players:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"getPlayer",{
    value:function(playerKey) {
      var idx = _var.players.findIndex((v) => v.key === playerKey);
      return (idx >= 0) ? _var.players[idx] : undefined;
    },
    enumerable: false
  });

  Object.defineProperty(this,"host",{
    get: function() {
      var playerKey = (typeof _app.room === "object") ? _app.room.hostKey : "";
      var player = this.getPlayer(playerKey);
      return (typeof player === "object") ? player : { key:playerKey, name:playerKey };
    },
    enumerable: false
  });

  Object.defineProperty(this,"isHost",{
    value:function(user) {
      return ((typeof _app.room === "object") && (typeof _app.user === "object") && (_app.room.hostKey === _app.user.key))
    },
    enumerable: false
  });

  //Returns the dealer player if there is one, otherwise host
  Object.defineProperty(this,"dealer",{
    get: function() {
      var playerKey = (_var.dealerKey != "") ? _var.dealerKey : this.hostKey;
      var player = this.getPlayer(playerKey);
      return (typeof player === "object") ? player : { key:playerKey, name:playerKey };
    },
    set: function(pValue) {
      var value = (typeof pValue === "object") ? pValue.key : (typeof pValue === "string") ? pValue : "";
      if (_var.dealerKey !== value) {
        _var.dealerKey = value;
        _var.lastUpdate = { dealerKey:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"isDealer",{
    value:function(user) {
      var userKey = (typeof user === "object") ? user.key : ((typeof user === "string") && (user !== "")) ? user : _app.user.key;
      return (userKey == _var.dealerKey);
    },
    enumerable: false
  });

  //Returns the active player if there is one, otherwise dealer or host
  Object.defineProperty(this,"active",{
    get: function() {
      var playerKey = (_var.activeKey != "") ? _var.activeKey : (_var.dealerKey != "") ? _var.dealerKey : this.hostKey;
      var player = this.getPlayer(playerKey);
      return (typeof player === "object") ? player : { key:playerKey, name:playerKey };
    },
    set: function(value) {
      var value = (typeof pValue === "object") ? pValue.key : (typeof pValue === "string") ? pValue : "";
      if (_var.activeKey !== value) {
        _var.activeKey = value;
        _var.lastUpdate = { activeKey:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"isActive",{
    value:function(user) {
      var userKey = (typeof user === "object") ? user.key : ((typeof user === "string") && (user !== "")) ? user : _app.user.key;
      return (userKey == _var.activeKey);
    },
    enumerable: false
  });

  //Returns the high hand/bet player if there is one, otherwise first player after dealer
  Object.defineProperty(this,"high",{
    get: function() {
      var playerKey = _var.highKey;
      var player = this.getPlayer(playerKey);
      return (typeof player === "object") ? player : { key:playerKey, name:playerKey };
    },
    set: function(value) {
      var value = (typeof pValue === "object") ? pValue.key : (typeof pValue === "string") ? pValue : "";
      if (_var.highKey !== value) {
        _var.highKey = value;
        _var.lastUpdate = { highKey:value };
      }
    },
    enumerable: false
  });

  //Returns true if user is the high better, which is set automatically by betting functions
  Object.defineProperty(this,"isHigh",{
    value:function(user) {
      var userKey = (typeof user === "object") ? user.key : ((typeof user === "string") && (user !== "")) ? user : _app.user.key;
      return (userKey == _var.highKey);
    },
    enumerable: false
  });

  Object.defineProperty(this,"stacks",{
    get: function() { return _stacks; },
    //set: function(value) { _stacks = value; },
    enumerable: false
  });

  Object.defineProperty(this,"cards",{
    get: function() { return _cards; },
    //set: function(value) { _cards = value; },
    enumerable: false
  });

  Object.defineProperty(this,"config",{
    get: function() { return _config; },
    //set: function(value) { _config = value; },
    enumerable: false
  });

  /****** Constants ******/
  Object.defineProperty(this,"defaultActions",{
    value:{
      /* Everyone Actions */
      scores: { key:"scores", label:"Scores", menu:"game", filter:{ }, options:{ id:"dlgScores" }, method:"showDialog" },
      rules: { key:"rules", label:"Rules", menu:"game", filter:{ }, options:{ id:"dlgRules" }, method:"showDialog" },
      leave_game: { key:"leave_game", label:"Leave Game", menu:"game", filter:{ actor:"host" }, options:{}, method:"leaveGame" },
      /* Host Actions */
      settings: { key:"settings", label:"Game Settings", menu:"game", filter:{ actor:"host" }, options:{ id:"dlgGameSettings" }, method:"showDialog" },
      players: { key:"players", label:"Players", menu:"game", filter:{ actor:"host" }, options:{ id:"dlgPlayers" }, method:"showDialog" },
      new_deal: { key:"new_deal", label:"New Deal", menu:"game", filter:{ actor:"host" }, options:{}, method:"newDeal" },
      new_game: { key:"new_game", label:"New Game", menu:"game", filter:{ actor:"host" }, options:{ id:"dlgGamesMenu" }, method:"showDialog" },
      /* Dealer Actions */
      reshuffle: { key:"shuffle", label:"Shuffle Deck", menu:"game", filter:{ actor:"dealer" }, options:{ from_stack:"discard", to_stack:"deck" }, method:"reshuffle" },
      deal: { key:"deal", label:"Deal", menu:"game", filter:{ actor:"dealer" }, options:{ from_stack:"deck", to_stack:"hand", face:"down", count:1 }, method:"deal" },
      deal_settings: { key:"deal_settings", label:"Deal &hellip;", menu:"game", filter:{ actor:"dealer" }, options:{ id:"dlgDeal" }, method:"showDialog" },
      start_turn: { key:"start_turn", label:"Next Player &hellip;", menu:"game", filter:{ actor:"dealer" }, options:{ player:"prompt" }, method:"startTurn" },
      /* Player Actions */
      draw: { key:"draw", label:"Draw", menu:"game", filter:{ actor:"player", minSel:1 }, options:{ mode:"replace", from_stack:"deck", to_stack:"hand", discard_stack:"discard", face:"default" }, method:"draw" },
      draw_one: { key:"draw_one", label:"Draw Card", menu:"game", filter:{ actor:"player", minCards:1 }, options:{ mode:"add", from_stack:"deck", to_stack:"hand", face:"default" }, method:"draw" },
      pick_up: { key:"pick_up", label:"Pick Up", menu:"game", filter:{ actor:"player", minSel:1 }, options:{ from_stack:"discard", to_stack:"hand", face:"default" }, method:"pickUp" },
      play: { key:"play", label:"Pick Up", menu:"game", filter:{ actor:"player", minSel:1 }, options:{ from_stack:"hand", to_stack:"table", face:"up" }, method:"play" },
      discard: { key:"discard", label:"Discard", menu:"game", filter:{ actor:"player", minSel:1 }, options:{ from_stack:"hand", to_stack:"discard", face:"down" }, method:"play" },
      bid: { key:"bid", label:"Bid &hellip;", menu:"game", filter:{ actor:"player" }, options:{ mode:"dialog" }, method:"bid" },
      bid_pass: { key:"bid_pass", label:"Pass", menu:"game", filter:{ actor:"player" }, options:{ mode:"pass" }, method:"bid" },
      claim: { key:"claim", label:"Claim", menu:"game", filter:{ actor:"player", minCards:2 }, options:{ from_stack:"table", to_stack:"tricks" }, method:"claim" },
      bet_check: { key:"bet_check", label:"Check", menu:"game", filter:{ actor:"player", maxBet:0 }, options:{ mode:"check" }, method:"bet" },
      bet_call: { key:"bet_call", label:"Call", menu:"game", filter:{ actor:"player", minBet:1 }, options:{ mode:"call" }, method:"bet" },
      bet_min: { key:"bet_min", label:"Bet Minimum", menu:"game", filter:{ actor:"player", minBet:1 }, options:{ mode:"min" }, method:"bet" },
      bet_max: { key:"bet_max", label:"Bet Maximum", menu:"game", filter:{ actor:"player" }, options:{ actor:"player", mode:"max" }, method:"bet" },
      bet: { key:"bet", label:"Bet &hellip;", menu:"game", filter:{ actor:"player" }, options:{ mode:"dialog" }, method:"bet" },
      end_turn: { key:"end_turn", label:"End Turn", menu:"game", filter:{ actor:"player" }, options:{ id:"next", actor:"player" }, method:"endTurn" },
      /* Stack Actions */
      sort_suit: { key:"sort_suit", label:"Group by Suit", menu:"stack", filter:{ minCards:3 }, options:{ sort:"suit" }, method:"sort" },
      sort_rank: { key:"sort_rank", label:"Group by Rank", menu:"stack", filter:{ minCards:3 }, options:{ sort:"rank" }, method:"sort" },
      sort_group: { key:"sort_group", label:"Group Selected", menu:"stack", filter:{ minSel:2 }, options:{ sort:"group" }, method:"sort" },
      select_all: { key:"select_all", label:"Select All", menu:"stack", filter:{ minCards:1 }, options:{ select:"all" }, method:"select" },
      unselect_all: { key:"unselect_all", label:"Unselect All", menu:"stack", filter:{ minCards:1 }, options:{ select:"none" }, method:"select" },
      flip: { key:"flip", label:"Turn Over", menu:"stack", filter:{ minSel:1 }, options:{ face:"flip", mode:"selected" }, method:"flip" },
      turn_up: { key:"turn_up", label:"Reveal", menu:"stack", filter:{ maxSel:0 }, options:{ face:"up", mode:"all" }, method:"flip" },
      turn_down: { key:"turn_down", label:"Turn Down", menu:"stack", filter:{ maxSel:0 }, options:{ face:"down", mode:"all" }, method:"flip" },
      pass_cards: { key:"pass_cards", label:"Pass Cards", menu:"game", filter:{ minSel:1 }, options:{ mode:"dialog" }, method:"pass" },
      move: { key:"move", label:"Move Selected &hellip;", menu:"game", filter:{ minSel:1 }, options:{ mode:"dialog" }, method:"move" },
      move_all: { key:"move", label:"Move All &hellip;", menu:"game", filter:{ maxSel:0 }, options:{ mode:"dialog" }, method:"move" }
    },
    enumerable: false
  });

  /****** Functions ******/

  Object.defineProperty(this,"nextPlayer",{
    value:function (relPlayer, relOffset, paramSkipFolded) {
      var relPlayerKey = (typeof relPlayer === "object") ? relPlayer.key : ((typeof relPlayer === "string") && (relPlayer != "")) ? relPlayer : (_var.activeKey != "") ? _var.activeKey : (_var.dealerKey != "") ? _var.dealerKey : this.hostKey;
      var offset = (typeof relOffset === "number") ? relOffset : 1;
      var skipFolder = (typeof paramSkipFolded === "boolean") ? paramSkipFolded : true;
      var players = _var.players;
      var nextP;
      if (skipFolded) {
        //remove folded players other than the relative player from the array
        players = players.filter((v) => ((v.key == relPlayerKey) || (v["folded"] !== true)));
      }
      //find the index of the relative player in the array
      var idx = players.findIndex((v) => v.key == relPlayerKey);
      if (idx == -1) {
        nextP = this.dealer;
      } else if (offset == 0) {
        nextP = players[idx];
      } else if (players.length == 1) {
        nextP = players[0];
      } else if (idx == (players.length - 1)) {
        nextP = players[0];
      } else {
        nextP = players[idx + 1];
      }
      //update the activeKey to new player key
      _var.activeKey = (typeof nextP == "object") ? nextP.key : "";
      //mark that UI needs updating
      _var.lastUpdate = Date.now();
      //return the next player object
      return nextP;
    },
    enumerable: false
  });

  Object.defineProperty(this,"getCard",{
    value:function(cardId) {
      return (typeof cardId == "object") ? cardId : (typeof _cards[cardId] == "object") ? _cards[cardId] : null;
    },
    enumerable: false
  });

  Object.defineProperty(this,"getStack",{
    value:function(stackId) {
      //accepts either stack object for stackId and returns stack object
      if (typeof stackId == "object") {
        return stackId
      } else {
        return _stacks[stackId];
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"initCards",{
    value:function(gameId) {
      //Rebuilds the cards collection based on game config

      var gameConfig = _config;
      var deckTypeId = "";
      var face = "down";

      /***** RESET card arrays and collections *************/
      _cards = {};

      /***** REBUILD CARDS COLLECTION *************/

      //use a single full deck as the default
      if (typeof gameConfig.decks == "undefined") { gameConfig["decks"] = "full"; }

      //use 0 as default for number of jokers per deck
      if (typeof gameConfig.jokers != "number") { gameConfig["jokers"] = 0; }

      var _decks = gameConfig["decks"];

      //if decks was a string, interpret as a deckType id
      if (typeof _decks != "object") {
        deckTypeId = ((typeof _decks == "string") && (_decks != "")) ? _decks : "full";
        _decks = {};
        _decks[deckTypeId] = 1;
      }

      //add jokers to the end of the deck if jokers settings is greater than 0
      if ((typeof gameConfig.jokers == "number") && (gameConfig.jokers > 0)) {
        _decks["jokers"] = gameConfig.jokers;
      }

      var o = 0; //used to set the rank order of each card type
      var deckPrefix = 0;
      for ( deckTypeId in _decks) {
        if (typeof _app.deckConfigs[deckTypeId] == "object") {
          deckPrefix++;
          var deck = _app.deckConfigs[deckTypeId].filter(v => true);
          //get the number of decks specified
          var numDecks = _decks[deckTypeId];
          //for each card type, multiply # of cards by number of decks (assuming 1 card if unspecified)
          deck.forEach((c) => c['n'] = (typeof c['n'] == 'number') ? c['n'] * numDecks : numDecks )
          //iterate over each cardType adding the specified number of cards to the cards collection
          for (var c=0; c < deck.length; c++) {
            //is number of cards to include in deck of this type
            //increment rank order for each new card type (assumes cards are in ascending rank order)
            var opt = Object.assign({ n:1, o:o++ }, deck[c], { key:'d' + deckPrefix + deck[c].id, stack:"deck", face:face, selected:false })
            //now add the specfified number of cards of this type to the cards collection
            for (var n=0; n < opt.n; n++) {
              opt.key = 'd' + deckPrefix + deck[c].id + n;
              var card = new Card(_app, opt);
              //add to cards collection
              _cards[card.key] = card;
            }
          }
        }
      }

      return _cards;
    },
    enumerable: false
  });

  Object.defineProperty(this,"sortByFace",{
    value:function(cardsToSort) {
      var _this = this;
      cardsToSort.sort(function(a, b){
        var cardA = (typeof a == "string") ? _this.getCard(a) : a;
        var cardB = (typeof b == "string") ? _this.getCard(b) : b;
        var i = (cardA.face == cardB.face) ? 0 : (cardA.face === "up") ? -1 : 1;
        return i;
      });
      return cardsToSort;
    },
    enumerable: false
  });

  Object.defineProperty(this,"sortByRank",{
    value:function(cardsToSort) {
      var _this = this;
      cardsToSort.sort(function(a, b){
        var cardA = (typeof a == "string") ? _this.getCard(a) : a;
        var cardB = (typeof b == "string") ? _this.getCard(b) : b;
        var i = (cardA.suit == cardB.suit) ? 0 : (cardA.suit < cardB.suit) ? -1 : 1;
        return i;
      });
      cardsToSort.sort(function(a, b){
        var cardA = (typeof a == "string") ? _this.getCard(a) : a;
        var cardB = (typeof b == "string") ? _this.getCard(b) : b;
        return cardA.rankOrder - cardB.rankOrder;
      });
      return cardsToSort;
    },
    enumerable: false
  });

  Object.defineProperty(this,"sortBySuit",{
    value:function(cardsToSort) {
      var _this = this;
      cardsToSort.sort(function(a, b){
        var cardA = (typeof a == "string") ? _this.getCard(a) : a;
        var cardB = (typeof b == "string") ? _this.getCard(b) : b;
        return cardA.rankOrder - cardB.rankOrder;
      });
      cardsToSort.sort(function(a, b){
        var cardA = (typeof a == "string") ? _this.getCard(a) : a;
        var cardB = (typeof b == "string") ? _this.getCard(b) : b;
        var i = (cardA.suit == cardB.suit) ? 0 : (cardA.suit < cardB.suit) ? -1 : 1;
        return i;
      });
      return cardsToSort;
    },
    enumerable: false
  });

  Object.defineProperty(this,"sortBySelection",{
    value:function(cardsToSort) {
      var _this = this;
      var arrSel = cardsToSort.filter(function (v) { var c=(typeof v == "string") ? _app.getCard(v) : v; return c.selected === true; });
      for (var x=cardsToSort.length-1; x>=0; x--) {
        var card = (typeof cardsToSort[x] == "string") ? _this.getCard(cardsToSort[x]) : cardsToSort[x];
        if (card.selected) { cardsToSort.splice(x, 1);}
      }
      for (var x=arrSel.length-1; x>=0; x--) {
        cardsToSort.unshift(arrSel[x]);
      }
      return cardsToSort;
    },
    enumerable: false
  });

  Object.defineProperty(this,"writeCard",{
    value:function(target, cardId) {
      var card = this.getCard(cardId);
      $(target).append(_app.applyTemplate("card", card));
    },
    enumerable: false
  });

  Object.defineProperty(this,"initStacks",{
    value:function(paramGameConfig) {

      var gameConfig = (typeof paramGameConfig == "object") ? paramGameConfig : _config;
      var arrStackConfigs = gameConfig.stacks;
      var x, p, k, group, cfg, card, n, cards;
      var arrCfg = []; //holds expanded config files to process

      //clear out all stacks from collection and add default stacks back
      _stacks = {};

      //Deck Defaults
      _stacks["deck"] = new Stack(_app, {
          key:"deck", label:"Deck", group:"deck", shared:true, layout:"stack", face:"down", initUp:0, initDown:0, cardAction:"select",
          actions:[
            { key:"deal", label:"Deal", menu:"stack", fn:"deal", obj:"stack", cards:"stack", groups:["hand:*"], filters:{ dealer:true, minCards:1 }, options:{} },
            { key:"shuffle", label:"Shuffle", menu:"stack", fn:"shuffle", obj:"stack", cards:"stack", groups:[ "discard:*", "hand:*", "shared:*"], filters:{ dealer:true, maxCards:0 }, options:{} }
          ]
        });

      //Discard Defaults
      _stacks["discard"] = new Stack(_app, {
          key:"discard", label:"Discard", group:"discard", shared:true, layout:"stack", face:"up", initUp:0, initDown:0, cardAction:"select",
          actions:[
            { key:"pickup", label:"Pick Up", menu:"stack", fn:"move", obj:"stack", cards:"selection", groups:[ "hand:owner" ], filters:{ everyone:true, minCards:1 }, options:{} }
          ]
        });

      //Shared Defaults
      _stacks["shared"] = new Stack(_app, {
          key:"shared", label:"Shared", group:"shared", shared:true, layout:"space", face:"up", initUp:0, initDown:0, cardAction:"select",
          actions:[
            { key:"draw", label:"Draw", menu:"stack", fn:"draw", obj:"stack", cards:"stack", groups:["deck:*"], filters:{ dealer:true }, options:{} }
          ]
        });

      //Hand(s) Defaults
      for (x = 0; x < _var.players.length; x++) {
        _stacks["hand_" + x] = new Stack(_app, {
            key:"hand_" + x, label:"Hand", group:"hand", shared:false, layout:"fan", face:"down", initUp:0, initDown:0, owner:_var.players[x].key, cardAction:"select",
            actions:[
              { key:"draw", label:"Draw", menu:"stack", fn:"draw", obj:"stack", cards:"selection", groups:["deck:*"], filters:{ }, options:{} },
              { key:"discard", label:"Discard", menu:"stack", fn:"move", obj:"stack", cards:"selection", groups:["discard:shared","discard:owner"], filters:{ owner:true, minSel:1 }, options:{} }
            ]
          });
      }

      //resolve arrStackConfigs into unqiue stack configs for all players
      for (x = 0; x < arrStackConfigs.length; x++) {
        group = arrStackConfigs[x]["key"];
        cfg = Object.assign({}, arrStackConfigs[x], { group:group });
        if (cfg["shared"] === true) {
          //if stack is shared, just create one copy
          arrCfg.push(Object.assign({}, cfg, { owner:"" }));
        } else {
          //otherwise, create a stack with a unique key for each player
          for (p = 0; p < _var.players.length; p++) {
            arrCfg.push(Object.assign({}, cfg, { key:group + '_' + p, owner:_var.players[p].key }));
          }
        }
      }

      //now iterate thru stack configs adding or updating each
      for (x = 0; x < arrCfg.length; x++ ) {
        var cfg = arrCfg[x];
        if (typeof _stacks[cfg.key] == "object") {
          //entry exists so just update it
          for (k in cfg) {
            _stacks[cfg.key][k] = cfg[k];
          }
        } else {
          //otherwise create a new stack
          _stacks[cfg.key] = new Stack(_app, cfg);
        }
      }

      //Now rebuild cards collection
      this.initCards();

      //get all the card keys from the cards collection
      var availCards = Object.keys(_cards);
      //now shuffle the cards
      for (let i = availCards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [availCards[i], availCards[j]] = [availCards[j], availCards[i]];
      }

      //now initialize cards in each
      for (k in _stacks) {
        var stack = _stacks[k];
        //initial down cards
        var downKeys = availCards.splice(-1 * stack.initDown, stack.initDown);
        var upKeys = availCards.splice(-1 * stack.initUp, stack.initUp);
        downKeys.forEach(function(v){ _cards[v].lastUpdate = { stack:stack.key, face:'down', selected:false }; });
        upKeys.forEach(function(v) { _cards[v].lastUpdate = { stack:stack.key, face:'up', selected:false }; });
        _stacks[k].cardKeys = _stacks[k].cardKeys.concat(downKeys, upKeys);
      }
      //now add remining cards to the front of deck stack
      if ((typeof _stacks.deck === "object") && (availCards.length > 0)) {
        availCards.forEach(function(v){ _cards[v].lastUpdate = { stack:'deck', face:'down', selected:false }; });
        _stacks.deck.cardKeys = [].concat(availCards, _stacks.deck.cardKeys);
      }

/*
      //Add all cards to the deck stack and shuffle them
      if (typeof _stacks.deck == "object") {
        _stacks.deck.cardKeys = Object.keys(_cards);
        _stacks.deck.shuffle();
      }

      //now initialize cards in each
      for (k in _stacks) {
        //initial down cards
        n = (typeof _stacks[k].initDown == "number") ? _stacks[k].initDown : 0;
        if ((n > 0) && (k != "deck")) {
          _stacks[k].draw({ group:"deck", num_cards:n, face:"down", selected:false });
        }
        //initial up cards
        n = (typeof _stacks[k].initUp == "number") ? _stacks[k].initUp : 0;
        if (n <= 0) {
          //no cards need to be drawn
        } else if (k != "deck") {
          //draw n cards from the deck face up
          _stacks[k].draw({ group:"deck", num_cards:n, face:"up", selected:false });
        } else {
          //special case for deck up cards, we just change their face property
          cards = _stacks[k].cards;
          for (n = Math.max(cards.length - n, 0); n < cards.length; n++) {
            cards[n].face = "up";
          }
        }
        _stacks[k].groupBy(_stacks[k]["sort"]);
      }

*/
      this.refreshUI(true);

    },

    enumerable: false
  });

  Object.defineProperty(this,"updateCards",{
    value:function($sel, pCards, sort) {
      var game = this;
      var cards = pCards.map((v) => game.getCard(v));
      $sel.html("");
      for (var c = 0; c < cards.length; c++) {
        this.writeCard($sel, cards[c]);
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"init",{
    value:function(paramConfig) {
      //*** Initialize players
/*
      if (_var.players.length == 0) {
        _var.players.push(new Player(_app, { key:_app.user.key, name:_app.user.name }));
      }
      _var.players.push(new Player(_app, { key:"jmills", name:"Jennifer" }));
      _var.players.push(new Player(_app, { key:"hmills", name:"Helen" }));
      _var.players.push(new Player(_app, { key:"lmills", name:"Liam" }));
      this.newHand();
*/
    },
    enumerable: false
  });

  Object.defineProperty(this,"gamearea",{
    value:function() {

      _app.applyTemplate("gamearea", _app, "#gamearea");

      //output public stacks
      var stacks = Object.values(_stacks).filter((v) => v.key == v.group)
      stacks.forEach(function(paramStack) {
        var stack = paramStack;
        _config.display.forEach(function(displayItem) {
          //if item is for this stack then append the stack's html to matched selectors
          if (displayItem[1] == stack.key) {
            $(displayItem[0]).append(_app.applyTemplate("stack", stack));
          }
        }) //displayItem
      }) //stack

      //output user stacks
      _var.players.forEach(function(pPlayer, pIndex){
        var userKey = _app.user.key;
        var player = pPlayer;
        var playerKey = pPlayer.key;
        var playerSuffix = "_" + pIndex;
        var stacks = Object.values(_stacks).filter((v) => v.key == v.group + playerSuffix);
        stacks.forEach(function(paramStack) {
          var stack = paramStack;
          _config.display.forEach(function(paramDisplayItem) {
            var arrItem = paramDisplayItem;
            var selector = arrItem[0];
            var matchGroup = arrItem[1];
            var matchType = (arrItem.length > 0) ? arrItem[2] : (stack.group == stack.key) ? "everyone" : "owner";
            //stack should only be output if it ...
            //  1. matches specified group and ...
            //  2. matchType is everyone OR matchType is owner and stack owner is current user
            var matches = (stack.group != matchGroup) ? false : (matchType == "everyone") ? true : (matchType != "owner") ? false : (stack.owner.key == _app.user.key) ? true : false;
            if (matches) {
              $(selector).append(_app.applyTemplate("stack", stack));
            }
          }) //displayItem
        }) //stack
      }) //player

    },
    enumerable: false
  });

  Object.defineProperty(this,"newHand",{
    value:function(pConfig) {

      _app.ready = false;

      var x=0;
      var html = "";
      var gameConfig = _config;
      var stacks;

      //set the access code to the game's key (i.e. the room key for the game)
      _app.accessCode = this.key;
      _app.gameType = _var.configKey;

      //preserve player information
      var players = _var.players;

      //use existing setting for any settings that are missing in pConfig
      var opt = Object.assign ({ players:_var.players, dealerKey:_var.dealerKey, activeKey:_var.dealerKey, highKey:"" }, pConfig);


      //apply game-specific css
      $("#game-css").html(this.css);

      //reset hand-level properties
      _var.players = (Array.isArray(opt.players)) ? opt.players : _var.players;
      //add the user as the first player if no players are defined
      if (_var.players.length === 0) {
        _var.players = [ new Player(_app, { key:_app.user.key}) ];
        _var.dealerKey = (typeof opt.dealerKey === "string") ? opt.dealerKey : (_var.dealerKey != "") ? _var.dealerKey : _var.players[0].key;
        _var.activeKey = (typeof opt.activeKey === "string") ? opt.activeKey : _var.dealerKey;
        _var.highKey = (typeof opt.highKey === "string") ? opt.highKey : "";
      }


      //reset player's hand level properties

      //rebuilds cards collection and resets all stacks
      this.initStacks();

      //clear playing area
      _app.applyTemplate("gamearea", _app, "#gamearea");

      /* Set Game Title */
      $("body").attr("game", this.title)

      //this.gamearea();
      //_app.ready = true;
      this.lastUpdate = true;
      _var.lastRefresh = 0;
    },
    enumerable: false
  });

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Game;
} else {
  window.Game = Game;
}
})();
