(function() {

var User = function (application, config) {
  //store a private reference to the application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  //define private config variable to hold property values
  var _var = Object.assign ( { key:_app.randomCode(6, "u"), username:"", name:"", email:"", photo:"", avatar:"", lastUpdate:Date.now(), lastRefresh:0 }, config );

  /****** STATE AN UI MANAGEMENT ******/
  Object.defineProperty(this,"toJSON",{
    value:function() {
      return this.state;
    },
    enumerable: false
  });

  Object.defineProperty(this,"state",{
    get: function() {
      var obj = { key:_var.key, accessCode:_var.accessCode, gameType:_var.gameType, username:_var.username, name:_var.name, email:_var.email, photo:_var.photo, avatar:_var.avatar, lastUpdate:_var.lastUpdate };
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
            _app.io.emit("state", "profile", _var.key, pushState);
          }
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState && _app.ready) {
            _app.io.emit("state", "profile", _var.key, this.state);
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
    //set: function(value) { _var.key = value; },
    enumerable: false
  });

  Object.defineProperty(this,"username",{
    get: function() { return _var.username; },
    set: function(value) {
      if ((typeof value === "string") && (_var.username != value)) {
        _var.username = value;
        this.lastUpdate = { username:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"name",{
    get: function() { return _var.name; },
    set: function(value) {
      if ((typeof value === "string") && (_var.name != value)) {
        _var.name = value;
        this.lastUpdate = { name:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"email",{
    get: function() { return _var.email; },
    set: function(value) {
      if ((typeof value === "string") && (_var.email != value)) {
        _var.email = value;
        this.lastUpdate = { email:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"photo",{
    get: function() { return _var.photo; },
    set: function(value) {
      if ((typeof value === "string") && (_var.photo != value)) {
        _var.photo = value;
        this.lastUpdate = { photo:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"avatar",{
    get: function() { return _var.avatar; },
    set: function(value) {
      if ((typeof value === "string") && (_var.avatar != value)) {
        _var.avatar = value;
        this.lastUpdate = { avatar:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"player",{
    /**
     * If in a game, returns the first player entry with a key matching user key
     **/
    get: function() {
      var players = [];
      var userKey = _var.key;
      if (_app.game && _app.game.players) {
        players = _app.game.players.filter(v => (v.key === userKey));
      }
      return (players.length) ? players[0] : undefined;
    },
    enumerable: false
  });

  Object.defineProperty(this,"host",{
    /**
     * If in a room, returns/sets whether user is the host
     **/
    get: function() {
      var userKey = _var.key;
      return (_app.room && _app.room.hostKey && (userKey === _app.room.hostKey));
    },
    set: function(value) {
      var userKey = _var.key;
      if (_app.room && (value === true)) {
        _app.room.hostKey = userKey;
      } else if (this.host) {
        //set new host to first available user
        var users = Object.keys(_app.room.users).filter(v => (v.key !== userKey));
        _app.room.hostKey = (users.length) ? users[0].key : "";
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"dealer",{
    /**
     * If in a game, returns/sets whether user is dealer
     *  if set to false the next available player is made dealer
     **/
    get: function() {
      var userKey = _var.key;
      return (_app.game && _app.game.dealer && (userKey === _app.game.dealer.key));
    },
    set: function(value) {
      var userKey = _var.key;
      if (_app.game && _app.game.dealer) {
        if ((value === true) && (_app.game.dealer.key !== userKey)) {
          _app.game.dealer = userKey;
        } else if (_app.game.dealer.key === userKey) {
          _app.game.dealer = "__next";
        }
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"active",{
    /**
     * If in a game, returns/sets whether user is active player
     *  if set to false the next non-folded player is made active
     **/
    get: function() {
      var userKey = _var.key;
      return (_app.game && _app.game.active && (userKey === _app.game.active.key));
    },
    set: function(value) {
      var userKey = _var.key;
      if (_app.game && _app.game.active) {
        if ((value === true) && (_app.game.active.key !== userKey)) {
          _app.game.active = userKey;
        } else if (_app.game.active.key === userKey) {
          _app.game.active = "__next";
        }
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"high",{
    /**
     * If in a game, returns/sets whether user is high better/bidder
     *  if set to false the next non-folded player is made high
     **/
    get: function() {
      var userKey = _var.key;
      return (_app.game && _app.game.high && (userKey === _app.game.high.key));
    },
    set: function(value) {
      var userKey = _var.key;
      if (_app.game && _app.game.high) {
        if ((value === true) && (_app.game.high.key !== userKey)) {
          _app.game.high = userKey;
        } else if (_app.game.high.key === userKey) {
          _app.game.high = "__next";
        }
      }
    },
    enumerable: false
  });

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = User;
} else {
  window.User = User;
}
})();
