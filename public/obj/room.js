(function() {

var Room = function (application, config) {

  //store a private reference to the application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  //define private config variable to hold property values
  var _var = Object.assign({ key:_app.randomCode(6), title:"", hostKey:"", users:{}, blockedUsers:{}, gameType:"", accessCode:_app.randomCode(6), isOpen:true, isPrivate:true, minUsers:0, maxUsers:10000, lastUpdate:Date.now(), lastRefresh:0 }, config);
  var _isServer = (config["isServer"] === true);

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
        title:_var.title,
        hostKey:_var.hostKey,
        users:_var.users,
        blockedUsers:_var.blockedUsers,
        gameType:_var.gameType,
        accessCode:_var.accessCode,
        isOpen:_var.isOpen,
        isPrivate:_var.isPrivate,
        minUsers:_var.minUsers,
        maxUsers:_var.maxUsers,
        lastUpdate:_var.lastUpdate
      };
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
      this.refreshUI(true);
    },
    enumerable: false
  });

  Object.defineProperty(this,"lastUpdate",{
    get: function() { return _var.lastUpdate; },
    set: function(pushState) {
      _var.lastUpdate = Date.now();
      if (!_app.ready) { return; }
      switch (typeof pushState) {
        case "object":
          if (_app.ready) { _app.io.emit("state", "room", _var.key, pushState); }
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState && _app.ready) {
            _app.io.emit("state", "room", _var.key, this.state);
          }
          break;
        default:
          console.log("Invalid type (" + typeof pushState + ") lastUpdate", pushState);
          break;
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"lastRefresh",{
    get: function() { return _var.lastRefresh; },
    set: function(value) { _var.lastRefresh = (typeof value === "number") ? value : _var.lastRefresh; },
    enumerable: false
  });

  Object.defineProperty(this,"refreshUI",{
    value:function(forceRefresh) {
      //greater than or equal to captures initial case of both being 0
      if (_app.ready && ((forceRefresh === true) || (_var.lastUpdate >= _var.lastRefresh))) {
        $("title").text(this.name);
        _var.lastRefresh = Date.now();
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"key",{
    get: function() { return _var.key; },
    //set: function(value) { _var.key = (typeof value === "string") ? value : _var.key; },
    enumerable: false
  });

  Object.defineProperty(this,"title",{
    get: function() { return (_var.title !== "") ? _var.title : _var.key; },
    set: function(value) {
      if ((typeof value === "string") && (_var.title != value)) {
        _var.title = value;
        this.lastUpdate = { title:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"hostKey",{
    get: function() { return _var.hostKey; },
    set: function() {
      if ((typeof value === "string") && (_var.hostKey != value)) {
        _var.hostKey = value;
        this.lastUpdate = { hostKey:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"users",{
    get: function() {
      return _var.users;
    },
    enumerable: false
  });

  Object.defineProperty(this,"blockedUsers",{
    get: function() {
      return _var.blockedUsers;
    },
    enumerable: false
  });

  Object.defineProperty(this,"gameType",{
    get: function() { return _var.gameType; },
    set: function(value) {
      if ((typeof value === "string") && (_var.gameType != value)) {
        if (typeof _app.gameConfigs[value] === "object") {
          _app.game = new Game(_app, _var.gameType);
        } else {
          value = "";
          _app.game = undefined;
        }
        _var.gameType = value;
        this.lastUpdate = { gameType:value };
      }
    },
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

  Object.defineProperty(this,"isOpen",{
    get: function() {
      return _var.isOpen;
    },
    set: function(value) {
      if ((typeof value === "boolean") && (_var.isOpen != value)) {
        _var.isOpen = value;
        this.lastUpdate = { isOpen:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"isPrivate",{
    get: function() { return _var.isPrivate; },
    set: function(value) {
      if ((typeof value === "boolean") && (_var.isPrivate != value)) {
        _var.isPrivate = value;
        this.lastUpdate = { isPrivate:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"minUsers",{
    get: function() { return _var.minUsers; },
    set: function(value) {
      if ((typeof value === "number") && (_var.minUsers != value)) {
        _var.minUser = value;
        this.lastUpdate = { minUsers:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"maxUsers",{
    get: function() { return _var.maxUsers; },
    set: function(value) {
      if ((typeof value === "number") && (_var.maxUsers != value)) {
        _var.maxUser = value;
        this.lastUpdate = { maxUsers:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"numUsers",{
    get: function() { return Object.keys(_var.users).length },
    enumerable: false
  });

//addUser, removeUser, blockUser and unblockUser are completely different between client and server
if (_app.key === "SERVER") {
  Object.defineProperty(this,"addUser",{
    value:function(pUser) {
      var userKey = (typeof pUser === "object") ? pUser.key : (typeof pUser === "string") ? pUser : "";
      var user = _app.getUser(userKey);
      var socket = user.socket;
      //Make user leave any other room first
      if (socket.__roomKey !== _var.key) {
        if (socket.__roomKey !== "") {
          socket.leave(socket.__roomKey);
          if (typeof _app.rooms[socket.__roomKey] === "object") {
            _app.rooms[socket.__roomKey].removeUser(user.key);
          }
        }
      }
      //now join user to this room
      socket.__roomKey = _var.key;
      socket.join(_var.key);
      socket.rooms[_var.key] = _var.title;
      console.log(user.key, user.socket.__roomKey, user.socket.rooms);
      //add to the room.users object
      _var.users[userKey] = user.state;
      //update the room setting for the user in question
      user.socket.emit("state", "room", _var.key, this.toJSON());
      //send command to have all room members add user to thier room.users
      _app.io.to(_var.key).emit("addUser", { user:user.state, room:_var.key});
      //announce arrival
      _app.io.to(_var.key).emit("chatMessage", { title:_var.key, text:"has joined the gameroom.\n" + _var.title});
    },
    enumerable: false
  });
} else {
  Object.defineProperty(this,"addUser",{
    value:function(pUserData, pLocalOnly) {
      var userData = (typeof pUserData === "object") ? pUserData : { key:pUserData }
      if (typeof userData.key === "string" && userData.key !== "") {
        _var.users[userData.key] = Object.assign({}, _var.users[userData.key], userData, { lastUpdate:Date.now() });
        _var.lastUpdate = Date.now();
        if (pLocalOnly !== true) {
          _app.io.emit("joinRoom", { room:_var.key, user:userData.key });
        }
      }
    },
    enumerable: false
  });
}  //end if SERVER


if (_app.key === "SERVER") {
  Object.defineProperty(this,"removeUser",{
    value:function(pUserKey, pLocalOnly) {
      var userKey = (typeof pUserKey == "string") ? pUserKey : (typeof pUserKey === "object") ? pUserKey.key : "";
      var user = _app.users[userKey];
      if (typeof user === "object") {
        //delete user from room's users object
        delete _var.users[userKey];
        if (pLocalOnly !== true) {
          //send remove user to all users in room
          _app.io.to(_var.key).emit("removeUser", { user:userKey, room:_var.key });
          //announce departure
          _app.io.to(_var.key).emit("chatMessage", { title:_var.key, text:"has left the gameroom.\n" + _var.title});
          //unsubscribe the user from the room
          user.socket.leave(_var.key);
          user.socket.__roomKey = "";
          console.log(user.key, user.socket.__roomKey, user.socket.rooms);

        }
      }
    },
    enumerable: false
  });
} else {
  Object.defineProperty(this,"removeUser",{
    value:function(pUserData, pLocalOnly) {
      var userData = (typeof pUserData === "object") ? pUserData : { key:pUserData }
      if (typeof userData.key === "string" && userData.key !== "") {
        if (typeof userData.key === "string" && userData.key !== "") {
          delete _var.users[userData.key];
          _var.lastUpdate = Date.now();
          if (pLocalOnly !== true) {
            _app.io.emit("leaveRoom", { room:_var.key, user:userData.key });
          }
        }
      }
    },
    enumerable: false
  });
} //end if SERVER

if (_app.key === "SERVER") {
  Object.defineProperty(this,"blockUser",{
    value:function(userKey) {
      var user = _users[userKey];
      var err = "";
      if (typeof user !== "object") {
        err = "User (" + userKey +") not found.";
      } else if (_var.blockedUsers.findIndex((v) => v==user.key) >= 0) {
        err = user.name + " is already blocked.";
      } else {
        _var.blockedUsers.push(userKey);
      }
      return err;
    },
    enumerable: false
  });
} else {
  Object.defineProperty(this,"blockUser",{
    value:function(pUserData) {
      var userData = (typeof pUserData === "object") ? pUserData : { key:pUserData }
      if (typeof userData.key === "string" && userData.key !== "") {
        _app.io.emit("blockUser", _var.key, userData);
      }
    },
    enumerable: false
  });
} //end if SERVER

if (_app.key === "SERVER") {
  Object.defineProperty(this,"unblockUser",{
    value:function(userKey) {
      var user = _users[userKey];
      var err = "";
      if (typeof user !== "object") {
        err = "User (" + userKey +") not found.";
      } else if (_var.blockedUsers.findIndex((v) => v==user.key) == -1) {
        err = user.name + " is not blocked.";
      } else {
        _var.blockedUsers.splice(_var.blockedUsers.findIndex((v) => v==user.key), 1);
      }
      return err;
    },
    enumerable: false
  });
} else {
  Object.defineProperty(this,"unblockUser",{
    value:function(pUserData) {
      var userData = (typeof pUserData === "object") ? pUserData : { key:pUserData }
      if (typeof userData.key === "string" && userData.key !== "") {
        _app.io.emit("unblockUser", _var.key, userData);
      }
    },
    enumerable: false
  });
} //end if SERVER

//destory command only exists on server
if (_app.key === "SERVER") {
  Object.defineProperty(this,"destroy",{
    value:function(blnAnnounce) {
      var room = this;
      //Boot users from the room
      Object.keys(_var.users).forEach((v) => { room.removeUser(v.key) });
      //remove from server rooms collection
      delete _app.rooms[room.key];
    },
    enumerable: false
  });
}

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Room;
} else {
  window.Room = Room;
}
})();
