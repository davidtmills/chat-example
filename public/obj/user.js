(function() {

var User = function (application, config) {
  //store a private reference to the application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  //define private config variable to hold property values
  var _var = Object.assign ( { key:_app.randomCode(6, "u"), accessCode:"", gameType:"", username:"", name:"", email:"", photo:"", avatar:"", lastUpdate:Date.now(), lastRefresh:0 }, config );

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

  Object.defineProperty(this,"accessCode",{
    get: function() { return _var.accessCode; },
    set: function(value) {
      if ((typeof value === "string") && (_var.accessCode != value)) {
        _var.accessCode = value;
        this.lastUpdate = { accessCode:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"gameType",{
    get: function() { return _var.gameType; },
    set: function(value) {
      if ((typeof value === "string") && (_var.gameType != value)) {
        _var.gameType = value;
        this.lastUpdate = { gameType:value };
      }
    },
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

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = User;
} else {
  window.User = User;
}
})();
