(function() {

function Action (application, pContext, pConfig) {
  /**
   * Action: Checks if a stack meets specified filter conditions to control access to functions.
   *
   * @param {Object}   Object       application Refrence to current application context object.
   * @param {string}   key          Unique key for this action.
   * @param {string}   label        Text to use as label for this action.
   * @param {function} label        Alternatively pass a function to call to produce the label.
   * @param {string}   action       Name of built-in function to call when executed.
   * @param {Object}   [defOpt]     Options defaults for options passed to fn and fnName calls.
   * @param {Object}   [staticOpt]  Options overrides for options passed to fn and fnName calls.
   **/
  var _app = application;
  var _key = "";
  var _ctx = {};
  var _cfg = {};
  var _fnNext = undefined;
  var _action = undefined;
  var _label = "";
  var _defaultOptions = {};
  var _staticOptions = {};
  var _options = {};
  var _actionFilters = [];
  var _stackFilters = [];
  var _cardFilters = [];
  var _actions = {};

  Object.defineProperty(this,"key",{
    /**
     * Summary: The key of this Action object, may only be set thru initial init
     **/
    get: function(){
      if (_key === "") {
        _key = (!!_cfg.key) ? _cfg.key : _app.getRandomCode(8, "A");
      }
      return _key;
    },
    enumerable: true
  });

  Object.defineProperty(this,"label",{
    /**
     * Summary: The label to use when displaying in the UI.
     **/
    get: function(){
      return (typeof _label === "function") ? _label() : (!!_label) ? _label : "action";
    },
    set: function(value) {
      _cfg["label"] = value;
      _label = (typeof _cfg.label === "function") ? _cfg.label.bind(this) : (!!cfg.label) ? _cfg.label : (typeof _cfg.action === "string") ? _cfg.action : "";
    },
    enumerable: true
  });

  Object.defineProperty(this,"fnNext",{
    /**
     * Summary: An additional function to run after each execution.
     **/
    get: function() {
      return _fnNext;
    },
    set: function(value) {
      _cfg["fnNext"] = value;
      _fnNext = (typeof _cfg.fnNext === "function") ? _cfg.fnNext : undefined;
    },
    enumerable: true
  });

  Object.defineProperty(this,"action",{
    /**
     * Summary: Name of built-in function to execute or a custom function.
     **/
    get: function() {
      return _action;
    },
    set: function(value) {
      _cfg["action"] = value;
      _action = (typeof _cfg.action === "function") ? _cfg.action.bind(this) : (_cfg.action && (typeof _actions[_cfg.action] === "function")) ? _actions[_cfg.action].bind(this) : undefined;
    },
    enumerable: true
  });

  Object.defineProperty(this,"actions",{
    /**
     * Summary: Returns a has of built-in actions.
     *    deal,draw,discard,play,give,take,replace,shuffle,flip,select,
     *    group,ungroup,order,dialog,claim,fold,check,call,raise,betMax,
     *    bid,pass,trump,orderUp
     **/
    get: function() {
      return _actions;
    },
    enumerable: true
  });


  Object.defineProperty(this,"context",{
    /**
     * Summary: The stack or card to use as the context.
     **/
    get: function() {
      return _ctx;
    },
    set: function(value) {
      _ctx = value;
    },
    enumerable: false
  });

  Object.defineProperty(this,"config",{
    /**
     * Summary: Returns the confgiuration object from creation or init with any
     *   changes made subsequently applied; can only be changed through init().
     **/
    get: function() { return _cfg; },
    enumerable: false
  });

  Object.defineProperty(this,"actionable",{
    get: function() {
      /**
       * Summary: Returns true if at least one actionFilter resolves to true
       *
       * Details: Any of the following properties may be evaluated in a filter
       *    player_key, player_name, player_folded, player_dealer, player_active,
       *    player_high, player_opener, player_points, player_bank, player_pot,
       *    player_bet, player_bid, player_tricks
       *    owner(true if _app.user), owner_key, owner_name, owner_folded,
       *    owner_dealer, owner_active, owner_high, owner_opener, owner_points,
       *    owner_bank, owner_pot, owner_bet, owner_bid, owner_tricks
       *    cardCount, selCount, unselCount, upCount, downCount
       **/
       var userData = _app.prefix(_app.user, "user_", ["avatar","email","key","lastRefresh","lastUpdate","name","photo","username"]);
       var playerData = _app.prefix(_app.game.getPlayer(_app.user.key), "player_");
       var stack = _ctx;
       var obj = Object.assign({ }, userData, playerData, _app.prefix(stack, "", ["actors","cardKeys","cardMenu","initDown","initUp","lastRefresh","lastUpdate","stackMenu"], { owner:"owner_" }) );
       var result = _app.check(obj, _actionFilters);
       return result;
    },

    enumerable: false
  });

  Object.defineProperty(this,"cards",{
    get: function() {
      /* Summary: Returns an array of cards within _ctx that pass the any one of the cardFilter criteria entries.
       *
       * Details: Any of the following property values may be used in filter criteria:
       *    card_key, card_face, card_selected, card_stack, card_prevStack, card_lastUpdate
       *    prevStack_key, prevStack_group, prevStack_shared, prevStack_order, prevStack_layout, prevStack_face
       *    prevOwner(true if _app.user), prevOwner_key, prevOwner_name, prevOwner_folded, prevOwner_dealer,
       *    prevOwner_active, prevOwner_high, prevOwner_opener, prevOwner_points, prevOwner_bank, prevOwner_pot,
       *    prevOwner_bet, prevOwner_bid, prevOwner_tricks
       */

      //sets potential cards based on context _ctx object
      //if Card single-item array, otherwise create array from _ctx.cardKeys or _ctx.cards property
      var cards = (_ctx && _ctx.stack) ? [_ctx] : (_ctx && _ctx.cardKeys && Array.isArray(_ctx.cardKeys)) ? _ctx.cardKeys : (_ctx && _ctx.cards && Array.isArray(_ctx.cards)) ? _ctx.cards : (_ctx && typeof _ctx.cards === "object") ? Object.keys(_ctx.cards) : [];

      var filters = _cardFilters
      var matches = [];
      cards.forEach((v) => {
        var card = _app.game.getCard(v);
        var userData = _app.prefix(_app.user, "user_", ["avatar","email","key","lastRefresh","lastUpdate","name","photo","username"]);
        var playerData = _app.prefix(_app.game.getPlayer(_app.user.key), "player_");
        var obj = Object.assign({ }, userData, playerData, _app.prefix(card, "", [], { stack:"stack_", prevStack:"prevStack_" }) );
        if (_app.check(obj, filters)) {
          matches.push(card);
        }
      });

      return matches;
    },
    enumerable: false
  });

  Object.defineProperty(this,"stacks",{
    get: function() {
      /**
       * Summary: Returns an array of stacks that pass the any one of the stackFilter criteria entries.
       *
       * Details: Any of the following property values may be used in filter criteria:
       *    key, group, shared, order, layout, face
       *    owner(true if _app.user), owner_key, owner_name, owner_folded, owner_dealer, owner_active, owner_high, owner_opener, owner_points, owner_bank, owner_pot, owner_bet, owner_bid, owner_tricks
       *    cardCount, selCount, unselCount, upCount, downCount.
       **/
      var matches = [];
      var userData = _app.prefix(_app.user, "user_", ["avatar","email","key","lastRefresh","lastUpdate","name","photo","username"]);
      var playerData = _app.prefix(_app.game.getPlayer(_app.user.key), "player_");
      Object.values(_app.game.stacks).forEach(function(v){
        var stack = v;
        var obj = Object.assign({ }, userData, playerData, _app.prefix(stack, "", ["actors","cardKeys","cardMenu","initDown","initUp","lastRefresh","lastUpdate","stackMenu"], { owner:"owner_" }) );
        if (_app.check(obj, _stackFilters)) {
          matches.push(stack);
        }
      });
      return matches;
    },

    enumerable: false
  });

  Object.defineProperty(this,"options",{
    get: function() {
      return Object.assign({}, _defaultOptions, _cfg["options"], _staticOptions);
    },
    set: function(value) {
      if (typeof value === "object") {
        _cfg["options"] = value;
        _options =  Object.assign({}, _defaultOptions, _cfg["options"], _staticOptions);
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"html",{
    get: function() {
      var html = "";
      if (!this.actionable) {
        html = "";
      } else if (typeof _cfg.template === "function") {
        html = _cfg.template(this);
      } else {
        var tplName = (!!_cfg.template) ? _cfg.template : "actionButton";
        html = _app.applyTemplate(tplName, this );
      }
      return html;
    },
    enumerable: false
  });

  Object.defineProperty(this,"execute",{
    value: function(pOptions){
      if (typeof _action === "function") {
        _action(pOptions, this);
      }
      if (typeof _fnNext === "function") {
        _fnNext(pOptions, this);
      }
      if (_cfg && _cfg.message) {
        _app.sendMessage(_cfg.message);
      }
    },
    enumerable: true
  });

  Object.defineProperty(this,"init",{
    value: function(pContext, pConfig, pFn) {
      _cfg = (!!pConfig) ? pConfig : {};
      _key = (!!_cfg.key) ? _cfg.key :  _app.randomCode(8, "A");
      _action = (typeof _cfg.action === "function") ? _cfg.action.bind(this) : (_cfg.action && (typeof _actions[_cfg.action] === "function")) ? _actions[_cfg.action].bind(this) : undefined;
      _fnNext = (typeof _cfg.fnNext === "function") ? _cfg.fnNext : undefined;
      _label = (typeof _cfg.label === "function") ? _cfg.label.bind(this) : (!!_cfg.label) ? _cfg.label : (typeof _cfg.action === "string") ? _cfg.action : "";
      _actionFilters = _parseActionFilter(_cfg['actionFilter']);
      _stackFilters = _parseStackFilter(_cfg['stackFilter']);
      _cardFilters = _parseCardFilter(_cfg['cardFilter']);
      _defaultOptions = (!!_cfg._defaultOptions) ? _cfg._defaultOptions : {};
      _staticOptions = (!!_cfg.staticOptions) ? _cfg.staticOptions : {};
      _options = Object.assign({}, _defaultOptions, _cfg.options, _staticOptions);
      _cardFace = (!!_cfg.cardFace) ? _cfg.cardFace : "default";
      _cardSelected = (!!_cfg.cardSelected) ? _cfg.cardSelected : "default";
      if (pContext && pContext.stack) {
        _ctx = pContext.stack;
        if (_cardFilters.length === 0) {
          _cardFilters.push({ key:pContext.key });
        }
      } else {
        _ctx = (!!pContext) ? pContext : {};
      }
    },
    enumerable: false
  });

  var _cardFace = function (card, targetStack) {
    var face = "";
    switch (_cfg["faceTo"]) {
      case "current": face = card.face; break;
      case "flip": face = (card.face !== "down") ? "down" : "up"; break;
      case "toggle": face = (card.face !== "down") ? "down" : "up"; break;
      case "up": face = "up"; break;
      case "down": face = "down"; break;
      default: face = (typeof targetStack === "object") ? targetStack.face : (_ctx && _ctx.face) ? _ctx.face : card.face; break;
    }
    return face;
  }

  var _cardSelected = function (card) {
    var sel = false;
    switch (_cfg["cardSelected"]) {
      case "current": sel = card.selected; break;
      case "default": sel = false; break;
      case "toggle": sel = !card.selected; break;
      case "flip": sel = !card.selected; break;
      case "true": sel = true; break;
      case "false": sel = false; break;
      case true: sel = true; break;
      case false: sel = false; break;
      default: sel = false; break;
    }
    return sel;
  }

  var _parseActionFilter = function (pInput) {
    var obj = [];
    if (Array.isArray(pInput)) {
      obj = pInput;
    } else if (typeof pInput === "object") {
      obj = [pInput];
    } else if (typeof pInput === "string") {
      var parts = pInput.split("=");
      if (parts.length > 1) {
        var o = {};
        o[parts[0]] = parts[1];
        obj.push(o);
      } else {
        switch (pInput) {
          case "folded": obj.push({ folded:true }); break;
          case "!folded": obj.push({ folded:false }); break;
          case "owner": obj.push({ owner:true }); break;
          case "!owner": obj.push({ owner:false }); break;
          case "dealer": obj.push({ dealer:true }); break;
          case "!dealer": obj.push({ dealer:false }); break;
          case "active": obj.push({ active:true }); break;
          case "!active": obj.push({ active:false }); break;
          case "high": obj.push({ high:true }); break;
          case "!high": obj.push({ high:false }); break;
          case "opener": obj.push({ opener:true }); break;
          case "!opener": obj.push({ opener:false }); break;
          case "points": obj.push({ points:true }); break;
          case "!points": obj.push({ points:false }); break;
          case "bank": obj.push({ bank:true }); break;
          case "!bank": obj.push({ bank:false }); break;
          case "pot": obj.push({ pot:true }); break;
          case "!pot": obj.push({ pot:false }); break;
          case "bid": obj.push({ bid:true }); break;
          case "!bid": obj.push({ bid:false }); break;
          case "tricks": obj.push({ tricks:true }); break;
          case "!tricks": obj.push({ tricks:false }); break;
          default: break;
        }
      }
    }
    return obj;
  }

  var _parseCardFilter = function(pInput) {
    var obj = [];
    if (Array.isArray(pInput)) {
      obj = pInput;
    } else if (typeof pInput === "object") {
      obj = [pInput];
    } else if (typeof pInput === "string") {
      //string may be simple check or a conditional group match
      var parts = pInput.split("=");
      if (parts.length > 1) {
        var o = {};
        o[parts[0]] = parts[1];
        obj.push(o);
      } else {
        switch (pInput) {
          case "up": obj.push({ face:"up" }); break;
          case "down": obj.push({ face:"down" }); break;
          case "selected": obj.push({ selected:true }); break;
          case "!selected": obj.push({ selected:false }); break;
          case "owner": obj.push({ owner:true }); break;
          case "!owner": obj.push({ owner:false }); break;
          case "prevOwner": obj.push({ prevOwner:true }); break;
          case "!prevOwner": obj.push({ prevOwner:false }); break;
        }
      }
    }

    return obj;
  }

  var _parseStackFilter = function(pInput) {
    var obj = [];
    if (Array.isArray(pInput)) {
      obj = pInput;
    } else if (typeof pInput === "object") {
      obj = [pInput];
    } else if (typeof pInput === "string") {
      //string maybe scoped group group:scope or attribute attrName=attrVal
      var parts = pInput.split("=");
      if (parts.length > 1) {
        var o = {};
        o[parts[0]] = parts[1];
        obj.push(o);
      } else {
        parts = pInput.split(":");
        var check = parts[parts.length - 1];
        switch (check) {
          case "owner": obj.push({ owner:true }); break;
          case "!owner": obj.push({ owner:false }); break;
          case "folded": obj.push({ owner_folded:true }); break;
          case "!folded": obj.push({ owner_folded:false }); break;
          case "dealer": obj.push({ owner_dealer:true }); break;
          case "!dealer": obj.push({ owner_dealer:false }); break;
          case "active": obj.push({ owner_active:true }); break;
          case "!active": obj.push({ owner_active:false }); break;
          case "opener": obj.push({ owner_opener:true }); break;
          case "!opener": obj.push({ owner_opener:false }); break;
          case "high": obj.push({ owner_high:true }); break;
          case "!high": obj.push({ owner_high:false }); break;
          case "shared": obj.push({ shared:true }); break;
          case "!shared": obj.push({ shared:false }); break;
          case "up": obj.push({ face:"up" }); break;
          case "down": obj.push({ face:"down" }); break;
          default: obj.push({ group:check }); break;
        }
        if (parts.length > 1) {
          obj[0]['group'] = parts[0];
        }
      }
    }

    return obj;
  }

  /************ BUILT-IN ACTIONS *************/
  _actions["deal"] = function (pOptions, pAction) {
    var opt = (!!pOptions) ? pOptions : {};
    var deck = _app.game.stacks.deck;
    var cards = deck.cardKeys.slice().map((v) => (_app.game.getCard(v)));
    var config = pAction.config;
    var numCards = (!!config.numCards) ? config.numCards : 1;
    var stacks = pAction.stacks;

    stacks.forEach(function(v){
      var stack = v;
      var stackKey = v.key;
      var stackCards = stack.cardKeys.slice();
      var dealt = cards.splice(-1 * numCards);

      //first update each card's face, selected, stack and prevStack silently
      dealt.forEach(function(v){
        var card = _app.game.getCard(v);
        var cardState = { face:card.face, selected:false, stack:stackKey, prevStack:deck.key }
        switch (config['cardFace']) {
          case 'toggle':
          case 'flip': cardState.face = (card.face !== 'up') ? 'up' : 'down'; break;
          case 'up': cardState.face = 'up'; break;
          case 'down': cardState.face = 'down'; break;
        }
        switch (config['selected']) {
          case 'toggle': cardState.selected = !card.selected; break;
          case 'current': cardState.selected = card.selected; break;
          case true: cardState.selected = true; break;
        }
        card.state = cardState;
        card.lastUpdate = cardState;
      });

      //then update the stack's cardKeys property normally to cause refresh
      stack.cardKeys = stackCards.concat(dealt);

    });
    //now update the deck's cardKeys;
    deck.cardKeys = cards;

  };

  _actions["give"] = function (pOptions, pAction) {
    var opt = (!!pOptions) ? pOptions : {};
    var deck = pAction.context;
    var matchedCards = pAction.cards;
    var cardKeys = matchedCards.map((v) => v.key);
    var config = pAction.config;
    var numCards = cardKeys.length;
    var stacks = pAction.stacks;
    var stack = (stacks.length > 0) ? stacks[0] : undefined;

    if (stack && stack.key){
      var stackKey = stack.key;
      var stackCards = stack.cardKeys.slice();

      //first update each card's face, selected, stack and prevStack silently
      matchedCards.forEach(function(v){
        var card = v;
        var cardState = { face:card.face, selected:false, stack:stackKey, prevStack:card.stack.key }
        switch (config['cardFace']) {
          case 'toggle':
          case 'flip': cardState.face = (card.face !== 'up') ? 'up' : 'down'; break;
          case 'up': cardState.face = 'up'; break;
          case 'down': cardState.face = 'down'; break;
        }
        switch (config['selected']) {
          case 'toggle': cardState.selected = !card.selected; break;
          case 'current': cardState.selected = card.selected; break;
          case true: cardState.selected = true; break;
        }
        card.state = cardState;
        card.lastUpdate = cardState;
      });

      //then update the stack's cardKeys property normally to cause refresh
      stack.cardKeys = stackCards.concat(cardKeys);

      //now update the deck's cardKeys;
      deck.cardKeys = deck.cardKeys.filter((v) => (cardKeys.indexOf(v)==-1));

    };

  };

  _actions["draw"] = function (pOptions) {};
  _actions["discard"] = function (pOptions) {};
  _actions["play"] = function (pOptions) {};
  _actions["take"] = function (pOptions) {};
  _actions["replace"] = function (pOptions) {};
  _actions["shuffle"] = function (pOptions) {};
  _actions["flip"] = function (pOptions) {};
  _actions["select"] = function (pOptions) {};
  _actions["group"] = function (pOptions) {};
  _actions["ungroup"] = function (pOptions) {};
  _actions["order"] = function (pOptions) {};
  _actions["dialog"] = function (pOptions) {};
  _actions["claim"] = function (pOptions) {};
  _actions["fold"] = function (pOptions) {};
  _actions["check"] = function (pOptions) {};
  _actions["call"] = function (pOptions) {};
  _actions["raise"] = function (pOptions) {};
  _actions["betMax"] = function (pOptions) {};
  _actions["bid"] = function (pOptions) {};
  _actions["pass"] = function (pOptions) {};
  _actions["trump"] = function (pOptions) {};
  _actions["orderUp"] = function (pOptions) {};

  //init using passed parameters
  this.init(pContext, pConfig);

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Action;
} else {
  window.Action = Action;
}
})();
