(function() {

var Stack = function (application, config) {
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
  //a collection of cards
  var _var = { key:"", label:"", group:"", owner:"", shared:false, order:0, layout:"fan", face:"down", initUp:0, initDown:0, cardAction:"select", actions:[], cards:[], lastUpdate:Date.now(), lastRefresh:0 }

  _var.key = (typeof config.key == "string") ? config.key : "";

  //set key to random unique alpha-numeric if unspecified
  if (_var.key == "") {
    _var.key = "S";
    while (_var.key.length < 6) { _var.key += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".substr(Math.random() * 36, 1); }
  }
  _var.label = (typeof config.label == "string") ? config.label : config.key;
  _var.group = (typeof config.group == "string") ? config.group : config.key;
  _var.owner = (typeof config.owner == "string") ? config.owner : "";
  _var.shared = (typeof config.shared == "boolean") ? config.shared : (config.owner == "") ? true : false;
  _var.order = (typeof config.order == "number") ? config.order : 0;
  _var.layout = (typeof config.layout == "string") ? config.layout : "fan";
  _var.face = (typeof config.face == "string") ? config.face : "down";
  _var.initUp = (typeof config.initUp == "number") ? config.initUp : 0;
  _var.initDown = (typeof config.initDown == "number") ? config.initDown : 0;
  _var.actions = (typeof config.actions == "object") ? config.actions : [];
  _var.cardAction = (typeof config.cardAction == "string") ? config.cardAction : "select";
  _var.cardActions = (typeof config.cardActions == "object") ? config.cardActions : [];
  _var.actionable = config["actionable"];
  _var.viewable = config["viewable"];
  _var.actors = (typeof config.actors == "object") ? config.actors : ((typeof config.actors == "string") && (config.actors != "")) ? [ config.actors ] : [];
  //config.cardKeys can be inited using config.cardKeys[cardKey,..] or config.cards[cardKey|card]
  //_var.cardKeys = ((typeof config.cardKeys === "object") && Array.isArray(config.cardKeys)) ? config.cardKeys : ((typeof config.cards === "object") && Array.isArray(config.cards)) ? config.cards.map((v) => ((typeof v == "object") && (typeof v.key === "string")) ? v.key : (typeof v === "string") ? v : "").filter((v)=>((typeof v === "string") && (typeof _app.game.cards(v) === "object"))) : [];
  _var.cardKeys = (Array.isArray(config["cardKeys"]))? config.cardKeys.map((v) => (typeof v === "object") ? v.key : v) : [];

  /****** STATE AN UI MANAGEMENT ******/
  Object.defineProperty(this,"toJSON",{
    value:function() {
      return this.state;
    },
    enumerable: false
  });

  Object.defineProperty(this,"state",{
    get: function() {
      var obj = { key:_var.key, face:_var.face, layout:_var.layout, cardKeys:_var.cardKeys, lastUpdate:_var.lastUpdate };
      return obj;
    },
    set: function(value) {
      var isDirty = false;
      //Now update any other property states
      for (var k in value) {
        if ((typeof _var[k] !== "undefined") && (_var[k] !== value[k])) {
        //if ((typeof _var[k] !== "undefined") && (JSON.stringify(_var[k]) !== JSON.stringify(value[k])) ) {
          isDirty = true;
          _var[k] = value[k];
        }
      }
      //make sure lastUpdate is updated if not specified in state
      if ((isDirty) && (typeof value.lastUpdate !== "number")) {
        _var.lastUpdate = Date.now();
      }
      this.refreshUI(isDirty);
    },
    enumerable: false
  });

  Object.defineProperty(this,"lastUpdate",{
    get: function() { return (typeof _var.lastUpdate == "number") ? _var.lastUpdate : 0 },
    set: function(pushState) {
      _var.lastUpdate = Date.now();
      if (!_app.ready) { return; }
      switch (typeof pushState) {
        case "object":
          if (_app.ready) { _app.io.emit("state", "stack", _var.key, pushState); }
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState && _app.ready) {
            _app.io.emit("state", "stack", _var.key, this.state);
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
    value:function(pForceRefresh) {
      if (_app.ready === false) {
        console.log("stack.refreshUI not ready", _var.key);
        return;
      }
      var forceRefresh = (pForceRefresh === true);
      var cards = this.cards;
      //greater than or equal to captures initial case of both being 0
      if ((forceRefresh === true) || (_var.lastUpdate >= _var.lastRefresh)) {
        console.log("rebuilding stack", _var.key, _var.cardKeys);
        _app.game.updateCards($("*[stack='" + this.key + "'] .pcards"), cards, _var["sort"]);
        _var.lastRefresh = Date.now();
      } else {
        //if not rebuilding the whole stack, then update card selection and faces
        console.log("just refreshing cards", _var.key, _var.cardKeys);
        cards.forEach(function(v){
          v.refreshUI(true);
        })
      }
    },
    enumerable: false
  });


  Object.defineProperty(this,"key",{
    value: _var.key,
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"label",{
    get: function() { return _var.label; },
    set: function(value) {
      if ((typeof value == "string") && (_var.label != value)) {
        _var.label = value;
        this.lastUpdate = { label:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"group",{
    get: function() { return _var.group; },
    set: function(value) {
      if ((typeof value == "string") && (_var.group != value)) {
        _var.group = value;
        this.lastUpdate = { group:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"owner",{
    get: function() {
      var playerKey = _var.owner;
      var player = (typeof _app.game === "object") ? _app.game.getPlayer(playerKey) : undefined;
      return (typeof player === "object") ? player : { key:playerKey, name:playerKey };
    },
    set: function(keyOrObject) {
      var value = (typeof keyOrObject == "object") ? keyOrObject.key : (typeof keyOrObject == "string") ? keyOrObject : "";
      if ((typeof value == "string") && (_var["owner"] != value)) {
        _var["owner"] = value;
        this.lastUpdate = { owner:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"actors",{
    get: function() {
      return _var.actors;
    },
    set: function(pValue) {
      value = (Array.isArray(pValue)) ? pValue : ((typeof pValue == "string") && (pValue != "")) ? [ pValue ] : [];
      if (_var.actors.join(",") !== value.join(",")) {
        _var.actors = value;
        this.lastUpdate = { actors:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"check",{
    value:function(conditions, blnMatchAll) {
      var x = 0, v = "", keys = [], vals = [];
      var cond = conditions;
      var ctx = {}
      var matchAll = (typeof blnMatchAll == "boolean") ? blnMatchAll : true;
      var result = matchAll;
      var user = (typeof _app.user == "object") ? _app.user.key : "";
      ctx.user = user;
      ctx.isOwner = (_var.owner == user) ? true : false;
      ctx.isDealer = ((typeof _app.game.dealer == "object") && (_app.game.dealer.key == user)) ? true : false;
      ctx.isActive = ((typeof _app.game.activePlayer == "object") && (_app.game.activePlayer.key == user)) ? true : false;
      ctx.isBidder = ((typeof _app.game.bidder == "object") && (_app.game.bidder.key == user)) ? true : false;
      ctx.isBetter = ((typeof _app.game.better == "object") && (_app.game.better.key == user)) ? true : false;
      ctx.isFolded = false;
      ctx.mode = ((typeof _app.game.mode == "string") && (_app.game.mode != "")) ? _app.game.mode : "play";
      ctx.numCards = _var.cardKeys.length; //use var to just get count based on cardKeys array
      ctx.numSel = this.cards.filter((v) => v.selected).length; //use cards property to have access to card properties
      ctx.numTricks = (Array.isArray(_app.game["tricks"])) ? _app.game.tricks.length : 0;
      ctx.numBids = 0;
      ctx.numBets = 0;
      ctx.amtBet = 0;
      ctx.amtOwed = 0;

      //ctx.mode = "bid";
      //ctx.numBids = 0;

      //updates result based on result of current check and matchAll setting
      var updateResult = function (newVal) {
        result = (matchAll) ? (result && newVal) : (result || newVal);
      }

      //if string try to parse as JSON object
      if (typeof cond == "string") {
        try { cond = JSON.parse(cond); } catch(e) { };
      }

      //if non-array object then get key and value arrays
      if ((typeof cond == "object") && (!Array.isArray(cond))) {
        //update  match mode based on object property UNLESS passed explicitly as func param
        if ((typeof blnMatchAll != "boolean") && (typeof cond.match_all == "boolean")) {
          matchAll = cond.match_all;
          result = matchAll;
        }
        keys = Object.keys(cond);
        vals = Object.values(cond);
      }

      //Iterates checking each condition until ...
      //1. a condition fails in ALL mode
      //2. OR a condition succeeds in ANY mode
      while ((x < keys.length) && (matchAll == result)) {
        v = vals[x];
        switch (keys[x]) {
          case "match_all": break;
          //Game settings
          case "mode": updateResult((ctx.mode == v)); break;
          //Role checks
          case "owner": updateResult((ctx.isOwner == v)); break;
          case "dealer": updateResult((ctx.isDealer == v)); break;
          case "active": updateResult((ctx.isActive == v)); break;
          case "bidder": updateResult((ctx.isBidder == v)); break;
          case "better": updateResult((ctx.isBetter == v)); break;
          //Card/Selection checks
          case "minCards": updateResult((ctx.numCards >= v)); break;
          case "maxCards": updateResult((ctx.numCards <= v)); break;
          case "minSel": updateResult((ctx.numSel >= v)); break;
          case "maxSel": updateResult((ctx.numSel <= v)); break;
          //Bidding/Tricks
          case "minTricks": updateResult((ctx.numTricks >= v)); break;
          case "maxTricks": updateResult((ctx.numTricks <= v)); break;
          case "minBids": updateResult((ctx.numBids >= v)); break;
          case "maxBids": updateResult((ctx.numBids <= v)); break;
          //Betting
          case "folded": updateResult((ctx.isFolded == v)); break;
          case "minBets": updateResult((ctx.numBets >= v)); break;
          case "maxBets": updateResult((ctx.numBets <= v)); break;
          case "minBet": updateResult((ctx.amtBet >= v)); break;
          case "maxBet": updateResult((ctx.amtBet <= v)); break;
          case "minOwed": updateResult((ctx.amtOwed >= v)); break;
          case "maxOwed": updateResult((ctx.amtOwed <= v)); break;
          default: console.log("Warning: unknown constraint ", keys[x], v);
        }
        //console.log("   check " + keys[x] + "=" + vals[x] + " is " + result);
        x++;
      }

      return result;
    },
    enumerable: false
  });

  Object.defineProperty(this,"hasRole",{
    value:function(contexts, def) {
      var x, v;
      var user = (typeof _app.user == "object") ? _app.user.key : "";
      var isOwner = (_var.owner == user) ? true : false;
      var isDealer = ((typeof _app.game.dealer == "object") && (_app.game.dealer.key == user)) ? true : false;
      var isActive = ((typeof _app.game.activePlayer == "object") && (_app.game.activePlayer.key == user)) ? true : false;
      var isBidder = ((typeof _app.game.bidder == "object") && (_app.game.bidder.key == user)) ? true : false;
      var isBetter = ((typeof _app.game.better == "object") && (_app.game.better.key == user)) ? true : false;
      var result = (typeof def == "boolean") ? def : true; //set result to default
      var list = [];

      switch (typeof contexts) {
        case "undefined": break;
        case "null": break;
        case "boolean": result = contexts; break;
        case "number": result = ((contexts >= 0) && (contexts < _app.players.length) && (_app.user.key == _app.players[contexts].key)); break;
        case "object": list = contexts; break; //Assume it's an array
        default: list.push(("" != contexts) ? contexts : result); //assume text or castable
      }

      if (list.length > 0 ) {
        //check items until we find one that is true or we run out
        result = false;
        x = 0;
        while ((x < list.length) && (result == false)) {
          v = "" + list[x];
          switch (v) {
            case "none": return false; break;
            case "noone": return false; break;
            case "false": return false; break;
            case "everyone": result = true; break;
            case "true": result = true; break;
            case "owner": result = isOwner; break;
            case "!owner": result = !isOwner; break;
            case "dealer": result = isDealer; break;
            case "!dealer": result = !isDealer; break;
            case "bidder": result = isBidder; break;
            case "!bidder": result = !isBidder; break;
            case "better": result = isBetter; break;
            case "!better": result = !isBetter; break;
            case "active":  result = isActive; break;
            case "!active":  result = !isActive; break;
          }
          x++;
        }
      }
      //console.log(this.key, "hasRole", result, contexts);
      return result;
    },
    enumerable: false
  });

  Object.defineProperty(this,"actionable",{
    get: function() {
      if (typeof _var.actionable != "undefined") {
        return this.hasRole(_var.actionable);
      } else {
        return (this.shared) ? true : ((typeof this.owner == "object") && (this.owner.key == _app.user.key)) ? true : false;
      }
    },
    set: function(value) {
      if ((typeof value == "string") && (_var["actionable"] != value)) {
        _var.actionable = value;
        this.lastUpdate = { actionable:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"viewable",{
    get: function() {
      //defaults to true is unspecified
      return this.hasRole(_var["viewable"], true);
    },
    set: function(value) {
      if ((typeof value == "string") && (_var["viewable"] != value)) {
        _var.viewable = value;
        this.lastUpdate = { viewable:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"shared",{
    get: function() { return (typeof _var.shared == "boolean") ? _var.shared : false; },
    //set: function(value) { _var["shared"] = value; },
    enumerable: false
  });

  Object.defineProperty(this,"order",{
    get: function() {
      var o = "";
      var owner = _var.owner;
      if (_var.shared || owner == "") {
        o = _var.order;
      } else {
        var idx = _app.game.players.findIndex((x) => x.key == owner);
        o = "1" + idx + _var.order;
      }
      return 0 + o;
    },
    set: function(value) {
      if ((typeof value == "number") && (value !== _var["order"])) {
        _var.order = value;
        this.lastUpdate = { order:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"layout",{
    get: function() { return (typeof _var.layout == "string" && _var.layout != "") ? _var.layout : "fan"; },
    set: function(value) {
      if ((typeof value == "string") && (_var["layout"] != value)) {
        _var.layout = value;
        this.lastUpdate = { layout:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"face",{
    get: function() { return (typeof _var.face == "string") ? _var.face : "down"; },
    set: function(value) {
      if ((typeof value == "string") && (_var["face"] != value)) {
        _var.face = value;
        this.lastUpdate = { face:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"initUp",{
    get: function() { return (typeof _var.initUp == "number") ? _var.initUp : 0; },
    set: function(value) {
      if ((typeof value == "number") && (_var["initUp"] != value)) {
        _var.initUp = value;
        this.lastUpdate = { initUp:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"initDown",{
    get: function() { return (typeof _var.initDown == "number") ? _var.initDown : 0; },
    set: function(value) {
      if ((typeof value == "number") && (_var["initDown"] != value)) {
        _var.initDown = value;
        this.lastUpdate = { initDown:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"cardAction",{
    get: function() { return (typeof _var.cardAction == "string" && _var.cardAction !== "") ? _var.cardAction : "select"; },
    set: function(value) {
      if ((typeof value == "string") && (_var["cardAction"] != value)) {
        _var.cardAction = value;
        this.lastUpdate = { cardAction:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"actions",{
    get: function() { return (typeof _var.actions == "object") ? _var.actions : []; },
    set: function(value) {
      if ((Array.isArray(value)) && (Array.isArray(_var["actions"])) && (value.join(",") !== _var.actions.join(","))) {
        _var.actions = value;
        this.lastUpdate = { actions:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"cardActions",{
    get: function() { return (typeof _var.cardActions == "object") ? _var.cardActions : []; },
    set: function(value) {
      if ((Array.isArray(value)) && (Array.isArray(_var["cardActions"])) && (value.join(",") !== _var.cardActions.join(","))) {
        _var.cardActions = value;
        this.lastUpdate = { cardActions:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"stackMenu",{
    get: function() {
      var menu = this.actions;
      var ck = this.check;
      //menu = menu.filter((v) => ck(v["filter"]));
      return _app.applyTemplate("actionlist", menu);
    },
    enumerable: false
  });

  Object.defineProperty(this,"cardMenu",{
    get: function() {
      var menu = this.cardActions;
      var ck = this.check;
      //menu = menu.filter((v) => ck(v["filter"]));
      return _app.applyTemplate("actionlist", menu);
    },
    enumerable: false
  });

  //returns cardKeys in an array
  Object.defineProperty(this,"cardKeys",{
    get: function() {
      return _var.cardKeys;
    },
    set: function(pValue) {
      //value can be array of either cardKeys or card objects
      var value = (Array.isArray(pValue)) ? pValue : _var.cardKeys.slice();
      value = value.map((v) => (typeof v === "object") ? v.key : v );
      if (_var.cardKeys.join(",") !== value.join(",")) {
        _var.cardKeys = value;
        this.lastUpdate = { cardKeys:value };
      }
    },
    enumerable: false
  });

  //returns cards in an array
  Object.defineProperty(this,"cards",{
    get: function() {
      //If game.cards exists and _var.cardKeys is array then map to array of card objects, otherwise return empty array
      return ((typeof _app.game === "object") && (typeof _app.game.cards === "object") && (Array.isArray(_var.cardKeys))) ? _var.cardKeys.map((v) => _app.game.getCard(v)) : [];
    },
    enumerable: false
  });

  //only the selected cards in the stack
  Object.defineProperty(this,"selection",{
    get: function() {
      var cards = this.cards;
      return cards.filter((v) => v.selected);
    },
    enumerable: false
  });

  //only the face up cards in the stack
  Object.defineProperty(this,"upCards",{
    get: function() {
      var cards = this.cards;
      return cards.filter((v) => v.face == "up");
    },
    enumerable: false
  });

  //only the face down cards in the stack
  Object.defineProperty(this,"downCards",{
    get: function() {
      var cards = this.cards;
      return cards.filter((v) => v.face == "down");
    },
    enumerable: false
  });

  /******* Stack Actions **********/

  //deal: moves specified number of cards from this stack to each of the specified stacks
  Object.defineProperty(this,"deal",{
    value: function(options) {
      console.log("deal", this.key, options)
      var c = (typeof options.num_cards == "number") ? options.num_cards : 1;
      var groups = (typeof options.groups == "object") ? options.groups : (typeof options.groups == "string") ? options.groups.split(",") : (typeof options.group == "string") ? [ options.group ] : [ "hand" ];
      var ownerKey = this.owner.key;
      var face = (typeof options["face"] == "string") ? options["face"] : (_var["face"] == "up") ? "up" : "down";
      var selected = (typeof options["selected"] == "boolean") ? options["selected"] : false;
      var stacks;
      var cardKeys = this.cardKeys.slice();
      //iterate over specified stack group targets
      for (var x = 0; x < groups.length; x++) {
        var g = groups[x].split(":");
        stacks = Object.values(_app.game.stacks);
        stacks = stacks.filter((v) => v.key == g[0] || v.group == g[0]);
        //handle subselectors such as ":owner"
        if (g.length > 1 && g[1] != "*") {
          switch (g[1]) {
            case "owner":
              stacks = stacks.filter((v) => v.owner.key == ownerKey);
          }
        }
        //now add cards to each of the valid stacks for this group entry
        for (var s = 0; s < stacks.length; s++) {
          var stack = stacks[s];
          var toCardKeys = stack.cardKeys.slice();
          for (var x = 0; x < c; x++) {
            //remove from this stack first so we can batch any ui updates
            var cardKey = cardKeys.pop();
            var card = _app.game.getCard(cardKey);
            if (typeof card == "object") {
              toCardKeys.push(card.key);
              //changing stack will remove from old stack and add to new one
              card.stack = stack.key;
              card.face = face;
              card.selected = selected;
            }
          }
          stack.cardKeys = toCardKeys;
        }
        //Now remove cards from this deck that were dealt out
        this.cardKeys = cardKeys;
      }
    },
    enumerable: false
  });

  //draw: moves specified number of cards from the specified stack to this one
  Object.defineProperty(this,"draw",{
    value: function(options) {
      var c = (typeof options.num_cards == "number") ? options.num_cards : 1;
      var group = (typeof options.group == "string") ? options.group : "deck";
      var ownerKey = (this.owner.key == "") ? _app.user.key : this.owner.key;
      var face = (typeof options["face"] == "string") ? options["face"] : (_var["face"] == "up") ? "up" : "down";
      var selected = (typeof options["selected"] == "boolean") ? options["selected"] : false;
      var stacks = Object.values(_app.game.stacks);
      stacks = stacks.filter((v) => v.key == group || v.group == group);
      //if more than one stack found for group then filter down to owner/user stack
      if (stacks.length > 1) {
        stacks = stacks.filter((v) => v.owner.key == ownerKey);
      }
      //only proceed if a stack was found
      if (stacks.length > 0) {
        var stack = stacks[0];
        var cardKeys = stack.cardKeys.slice();
        var toCardKeys = this.cardKeys.slice();
        for (var x = 0; x < c; x++) {
          var card = _app.game.getCard(cardKeys.pop());
          if (typeof card == "object") {
            toCardKeys.push(card.key);
            //changing stack will remove from old stack and add to new one
            card.stack = this.key;
            card.face = face;
            card.selected = selected;
          }
        }
        //make sure source stack is updated
        stack.cardKeys = cardKeys;
        //make sure this stack is update
        this.cardKeys = toCardKeys;
      }
    },
    enumerable: false
  });

  //shuffles: optionally collects cards from specified stacks and then shuffles cards in this stack
  Object.defineProperty(this,"shuffle",{
    value: function(options) {
      var groups = (typeof options != "object") ? [] : (typeof options.groups == "object") ? options.groups : (typeof options.groups == "string") ? options.groups.split(",") : (typeof options.group == "string") ? [ options.group ] : [];
      var ownerKey = this.owner.key;
      var stacks;
      var cardsToShuffle = this.cardKeys.slice();
      //iterate over specified stack group targets
      for (var x = 0; x < groups.length; x++) {
        var g = groups[x].split(":");
        stacks = Object.values(_app.game.stacks);
        stacks = stacks.filter((v) => v.key == g[0] || v.group == g[0]);
        //handle subselectors such as ":owner"
        if (g.length > 1 && g[1] != "*") {
          switch (g[1]) {
            case "owner":
              stacks = stacks.filter((v) => v.owner.key == ownerKey);
          }
        }
        //now move all cards from each of the valid stacks for this group entry
        for (var s = 0; s < stacks.length; s++) {
          var addCardKeys = stacks[s].cardKeys.slice();
          while(addCardKeys.length > 0) {
            cardsToShuffle.push(addCardKeys.pop());
          }
          stacks[s].cardKeys = addCardKeys;
        }
      }

      //now shuffle the cards
      for (let i = cardsToShuffle.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
        [cardsToShuffle[i], cardsToShuffle[j]] = [cardsToShuffle[j], cardsToShuffle[i]];
      }
      //maybe don't need but just to be safe update the property
      this.cardKeys = cardsToShuffle;
    },
    enumerable: false
  });

  //flip: toggles or sets the face of the all or selected cards
  Object.defineProperty(this,"flip",{
    value: function(options) {
      //cards: *selection, stack
      //dir: *toggle, up, down
      var cards = (options["cards"] == "stack") ? this.cards : this.selection;
      var dir = (typeof options["dir"] == "string") ? options["dir"] : "toggle";
      cards.forEach(function(v)
      {
        switch (dir)
        {
          case "up": v.face = "up"; break;
          case "down": v.face = "down"; break;
          default: v.face = (v.face == "down") ? "up" : "down";
        }
      })
      //indeciate the stack has changed
      this.lastUpdate = Date.now();
    },
    enumerable: false
  });

  //groupBy: sorts by rank or suit or groups selected cards
  Object.defineProperty(this,"groupBy",{
    value: function(groupMode) {
      var cards = _var.cardKeys.map((v)=>_app.game.getCard(v));
      //groupModes: rank, suit, selection
      switch (groupMode)
      {
        case "suit":
          _app.game.sortBySuit(cards);
          break;
        case "rank":
          _app.game.sortByRank(cards);
          break;
        case "selection":
          _app.game.sortBySelection(cards);
          break;
      }
      //Now update the cardKeys array
      this.cardKeys = cards.map((v) => v.key);
      this.refreshUI(true);
    },
    enumerable: false
  });

  //addCard: adds specified card to this stack
  Object.defineProperty(this,"addCard",{
    value: function(card, options, position) {
      var opt = (typeof options == "object") ? options : {};
      var cd = _app.game.getCard(card);
      var cardKeys = this.cardKeys.slice();
      if (typeof cd == "object") {
        //remove the card from its current stack by setting stack
        //cd.stack = "";
        var srcStack = _var.stacks[cd.stack];
        if (srcStack === "object") {
          srcStack.removeCard(cd);
        }
        //change face and selection status based on options or this stack's defaults
        cd.face = (typeof opt.face == "string") ? opt.face : (this.face == "up") ? "up" : "down";
        cd.selected = (typeof opt.selected == "boolean") ? opt.selected : false;
        //add card to stack's card array
        if ((typeof position == "number") && (position >= 0) && (position < cardKeys.length)) {
          //splice card into array at designated position
          cardKeys.splice(position, 0, cd);
        } else {
          //push card onto array
          cardKeys.push(cd);
        }
        //now set the stack property on the card object
        cd.stack = this.key;
      }
      this.cardKeys = cardKeys;
      //return the added card
      return cd;
    },
    enumerable: false
  });

  //removeCard: removes specified card from this stack
  Object.defineProperty(this,"removeCard",{
    value: function(card) {
      var cardKeys = this.cardKeys.slice();
      var cd = (cardKeys.length === 0) ? undefined : (card == "last") ? cardKeys[cardKeys.length-1] : (card == "first") ? cardKeys[0] : card;
      cd = _app.game.getCard(cd);
      if (typeof cd == "object") {
        var idx = cardKeys.findIndex((v) => (v === cd.key));
        if (idx >= 0) {
          cardKeys.splice(idx, 1);
          cd.stack = "";
        }
      }
      this.cardKeys = cardKeys;
      //return the removed card
      return cd;
    },
    enumerable: false
  });

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Stack;
} else {
  window.Stack = Stack;
}
})();
