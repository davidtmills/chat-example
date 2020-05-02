(function() {

var Player = function (application, options) {
  //store a private reference to the application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  //define private config variable to hold property values
  var _var = Object.assign ( { key:"", name:"", folded:false, buyIns:0, bank:0, wager:{ mode:"", bet:0, pot:0 }, bidding:{ round:0, bid:0, trump:"" }, tricks:[], scores:[], gamePoints:0, lastUpdate:Date.now(), lastRefresh:0 }, options );

  /****** STATE AN UI MANAGEMENT ******/
  Object.defineProperty(this,"toJSON",{
    value:function() {
      return this.state;
    },
    enumerable: false
  });

  Object.defineProperty(this,"state",{
    get: function() {
      var obj = { key:_var.key, name:_var.name, folded:_var.folded, buysIns:_var.buyIns, bank:_var.bank, wager:_var.wager, bidding:_var.bidding, tricks:_var.tricks, scores:_var.scores, gamePoints:_var.gamePoints, lastUpdate:_var.lastUpdate };
      return obj;
    },
    set: function(value) {
      var isDirty = false;
      //Now update any other property states
      for (var k in value) {
        if ((typeof _var[k] !== "undefined") && (_var[k] !== value[k])) {
          isDirty = true;
          _var[k] = value[k];
        }
      }
      //make sure lastUpdate is updated if not specified in state
      if ((isDirty) && (typeof value.lastUpdate !== "number")) {
        _var.lastUpdate = Date.now();
      }
      this.refreshUI(true);
    },
    enumerable: false
  });

  Object.defineProperty(this,"lastUpdate",{
    get: function() { return (typeof _var.lastUpdate == "number") ? _var.lastUpdate : 0 },
    set: function(pushState) {
      _var.lastUpdate = Date.now();
      switch (typeof pushState) {
        case "object":
          Object.assign(_var, pushState);
          if (_app.ready) {
            _app.io.emit("state", "player", _var.key, pushState);
          }
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState && _app.ready) {
            _app.io.emit("state", "player", _var.key, this.state);
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
    value:function(forceRefresh) {
      //greater than or equal to captures initial case of both being 0
      if (_app.ready && ((forceRefresh === true) || (_var.lastUpdate >= _var.lastRefresh))) {
        _var.lastRefresh = Date.now();
      }
    },
    enumerable: false
  });


  Object.defineProperty(this,"key",{
    get: function() { return _var.key; },
    set: function(value) { _var.key = value; },
    enumerable: false
  });

  Object.defineProperty(this,"name",{
    get: function() {
      return (_var.name !== "") ? _var.name : _var.key;
    },
    set: function(value) {
      if ((typeof value === "string") && (_var.name != value)) {
        _var.name = value;
        this.lastUpdate = { name:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"folded",{
    get: function() { return _var.folded; },
    set: function(value) {
      if ((typeof value === "boolean") && (_var.folded != value)) {
        _var.folded = value;
        this.lastUpdate = { folded:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"buyIns",{
    get: function() { return _var.buyIns; },
    set: function(value) {
      if ((typeof value === "number") && (_var.buyIns != value)) {
        _var.buyIns = value;
        this.lastUpdate = { buyIns:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"bank",{
    get: function() { return _var.bank; },
    set: function(value) {
      if ((typeof value === "number") && (_var.bank != value)) {
        _var.bank = value;
        this.lastUpdate = { bank:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"wager",{
    get: function() { return _var.wager; },
    set: function(value) {
      if ((typeof value === "number") && (_var.wager != value)) {
        _var.wager = value;
        this.lastUpdate = { wager:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"tricks",{
    get: function() { return _var.tricks; },
    set: function(value) {
      if ((_var.tricks != value) && (Array.isArray(value))) {
        _var.tricks = value;
        this.lastUpdate = { tricks:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"scores",{
    get: function() { return _var.scores; },
    set: function(value) {
      if ((_var.scores != value) && (Array.isArray(value))) {
        _var.scores = value;
        this.lastUpdate = { scores:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"gamePoints",{
    get: function() { return _var.gamePoints; },
    set: function(value) {
      if ((typeof value === "number") && (_var.gamePoints != value)) {
        _var.gamePoints = value;
        this.lastUpdate = { gamePoints:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"bidding",{
    get: function() { return _var.bidding; },
    set: function(value) {
      if ((typeof value === "object") && (_var.bidding != value)) {
        _var.bidding = value;
        this.lastUpdate = { bidding:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"total",{
    get: function()
    {
      var total = 0;
      _var.scores.forEach((v) => total += v);
      return total;
    },
    enumerable: false
  });

  Object.defineProperty(this,"seat",{
    get: function()
    {
      var thisKey = this.key;
      return _app.game.players.findIndex((v) => v.key == thisKey) + 1;
    },
    enumerable: false
  });

  Object.defineProperty(this,"index",{
    get: function()
    {
      var thisKey = this.key;
      return _app.game.players.findIndex((v) => v.key == thisKey);
    },
    enumerable: false
  });

  Object.defineProperty(this,"isHost",{
    get: function()
    {
      return _app.room.hostKey == this.key;
    },
    enumerable: false
  });

  Object.defineProperty(this,"isDealer",{
    get: function()
    {
      return ((typeof _app.game.dealer === "object") && (_app.game.dealer.key == this.key));
    },
    enumerable: false
  });

  Object.defineProperty(this,"isActive",{
    get: function()
    {
      return ((typeof _app.game.active === "object") && (_app.game.active.key == this.key));
    },
    enumerable: false
  });

  Object.defineProperty(this,"isHigh",{
    get: function()
    {
      return ((typeof _app.game.high === "object") && (_app.game.high.key == this.key));
    },
    enumerable: false
  });

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Player;
} else {
  window.Player = Player;
}
})();
