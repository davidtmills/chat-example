(function() {

var Application = function (appKey, socket) {
  var _app = this;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
  var _timer = 0;
  //define private config variable to hold property values
  var _var = { key:appKey, user:undefined, room:undefined, game:undefined, templates:{}, gameConfigs:{}, ready:true };

  //set key to random unique alpha-numeric if unspecified
  if ((typeof _var.key != "string") || (_var.key == "")) {
    _var.key = "S";
    while (_var.key.length < 8) { _var.key += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".substr(Math.random() * 36, 1); }
  }

  Object.defineProperty(this,"io",{
    value: socket,
    writable: false,
    enumerable: false
  });

  if (_var.key === "SERVER") {
    Object.defineProperty(this,"tick",{
      value: function(){
        //handle QuickPlays
      },
      writable: false,
      enumerable: false
    });
  } else {
    Object.defineProperty(this,"tick",{
      value: function(){
        var room = _app.room;
        var user = _app.user;
        if (typeof user === "object") {
          if (typeof room === "object") {
            if (room.hostKey == user.key) {
              var gameType = room.gameType;
              var game = _app.game;
              var config = (typeof _app.gameConfigs[gameType] === "object") ? _app.gameConfigs[gameType] : { minPlayers:0 };
              //update the waiting variables based on minimum players threshold
              room.waiting = Math.max(0, config.minPlayers - Object.keys(room.users).length);
            }
          }
        }
      },
      writable: false,
      enumerable: false
    });
  }

  Object.defineProperty(this,"timer",{
    get: function() {
      return _timer;
    },
    set: function(value) {
      clearInterval(_timer);
      if (value === true) {
        _timer = setInterval(_app.tick, 5000);
      } else {
        _timer = 0;
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"ready",{
    get: function() { return _var.ready; },
    set: function(value) { _var.ready = value; },
    enumerable: false
  });

  Object.defineProperty(this,"key",{
    get: function() { return _var.key; },
    set: function(value) { _var.key = value; },
    enumerable: false
  });

  Object.defineProperty(this,"user",{
    get: function() { return _var.user; },
    set: function(value) { _var.user = value; },
    enumerable: false
  });

  Object.defineProperty(this,"room",{
    get: function() { return _var.room; },
    set: function(value) {
      if ((typeof value !== "object") || (typeof _var.room !== "object") || (value.key !== _var.room.key)) {
        _var.game = undefined;
        _var.room = value;
        _app.applyTemplate("gamearea", _app, "#gamearea");
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"game",{
    get: function() { return _var.game; },
    set: function(value) { _var.game = value; },
    enumerable: false
  });

  Object.defineProperty(this,"deckConfigs",{
    get: function() { return _var.deckConfigs; },
    //set: function(value) { _var.deckConfigs = value; },
    enumerable: false
  });

  Object.defineProperty(this,"gameConfigs",{
    get: function() { return _var.gameConfigs; },
    //set: function(value) { _var.gameConfigs = value; },
    enumerable: false
  });

  Object.defineProperty(this,"emojis",{
    get: function() { return _var.emojis; },
    //set: function(value) { _var.emojis = value; },
    enumerable: false
  });

  Object.defineProperty(this,"protoUser",{
    value: { key:"", name:"", email:"", photo:"", avatar:"" },
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"protoPlayer",{
    value: { key:"", name:"", folded:false, dealer:false, active:false, high:false, opener:false, points:0, bank:0, pot:0, bet:0, bid:"", tricks:[] },
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"isHost",{
    get: function() {
      return ((typeof _app.user === "object") && (typeof _app.room === "object") && (_app.user.key === _app.room.hostKey));
    },
    enumerable: false
  });

  Object.defineProperty(this,"getUser",{
    value: function(pUser){
      if (_app.key === "SERVER") {
        return ((typeof pUser === "object") && (typeof pUser.__userKey === "string")) ? _app.users[pUser.__userKey] : (typeof pUser === "object") ? pUser : (typeof _app.users[pUser] === "object") ? _app.users[pUser] : undefined;
      } else {
        return (typeof pUser === "undefined") ? _app.user : (typeof pUser === "object") ? pUser : (typeof _app.room !== "object") ? undefined : (_app.room.users[pUser] === "object") ? _app.room.users[pUser] : undefined;
      }
    },
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"getRoom",{
    value: function(pRoom){
      if (_app.key === "SERVER") {
        var accessCode = ((typeof pRoom === "object") && (typeof pRoom.accessCode)) ? pRoom.accessCode : "";''
        var roomKey = (typeof pRoom === "string") ? pRoom : (typeof pRoom !== "object") ? "" : (typeof pRoom.__roomKey === "string") ? pRoom.__roomKey : (typeof pRoom.roomKey === "string") ? pRoom.roomKey : (typeof pRoom.key === "string") ? pRoom.key : "";
        var room = _app.rooms[roomKey];
        if (accessCode !== "") {
          var matches = Object.values(_app.rooms).filter((v) => (v.accessCode === accessCode));
          room  = (matches.length > 0) ? matches[0] : undefined;
          console.log("accessCode Match", matches.length);
        }
        return room;
      } else {
        return (typeof pRoom === "undefined") ? _app.room : (typeof pRoom === "object") ? pRoom : (typeof _app.room !== "object") ? undefined : (_app.room.key === pRoom) ? _app.room : undefined;
      }
    },
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"randomCode",{
    value:function (codeLength, prefix, chars) {
      var list = chars || "ABCDEFGHIJKLMNPQRSTVWXYZ123456789";
      var max = list.length - 1;
      var code = (typeof prefix == "string") ? prefix : "";
      for (var x=0; x<codeLength; x++) {
        code += list.substr(Math.random() * max, 1);
      }
      return code;
    },
    enumerable: false
  });

  Object.defineProperty(this,"randomNumber",{
    value:function (min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    enumerable: false
  });

  Object.defineProperty(this,"randomName",{
    value:function () {
      var adj = ["Sleepy","Funny","Warm","Wacky","Freaky","Strong","Weak","Sad","Hungry","Funky","Crazy"];
      var noun = ["Bear","Pig","Horse","Cat","Dog","Frog","Mouse","Rat","Snake","Dragon","Punk","Dude"];
      return adj[this.randomNumber(0,adj.length-1)] + noun[this.randomNumber(0,noun.length-1)] + this.randomNumber(10,100);
    },
    enumerable: false
  });

  Object.defineProperty(this,"sendMessage",{
    value:function(message, pSocket, pRoom) {
      var obj = { id:this.randomCode(8, "m"), title:"", text:"", icon:"", css:"", sender:"", ts:Date.now() };
      var socket = (typeof pSocket === "object") ? pSocket : _app.io;
      var roomKey = (_app.key === "SERVER") ? "" : (typeof pRoom === "string") ? pRoom : (typeof pSocket === "string") ? pSocket : ((typeof pSocket === "object") && (typeof pSocket.__roomKey === "string")) ? pSocket.__roomKey : "";
      if (roomKey !== "") {
        socket.to(roomKey);
      }
      if (typeof message == "string") {
        var parts = message.split("|");
        obj.text = "" + parts[0];
        obj.icon = (parts.length > 1) ? parts[1] : "";
        obj.css = (parts.length > 2) ? parts[2] : "";
        obj.title = (_app.key === "SERVER") ? "Server" : (typeof _app.user === "object") ? _app.user.name : "Guest";
      } else {
        obj = Object.assign(obj, message);
      }
      socket.emit('chatMessage', obj);
      return null;
    },
    enumerable: false
  });

  Object.defineProperty(this,"post",{
    value:function(message) {
      var obj = { id:this.randomCode(8, "m"), title:"", text:"", icon:"", css:"", sender:"", ts:Date.now() };
      if (typeof message == "string") {
        var parts = message.split("|");
        obj.text = "" + parts[0];
        obj.icon = (parts.length > 1) ? parts[1] : "";
        obj.css = (parts.length > 2) ? parts[2] : "";
        obj.title = _app.user.name;
      } else {
        obj = Object.assign(obj, message);
      }
      this.applyTemplate("toast", obj, "#toasts", "append");
      $("#" + obj.id).toast('show');
      return null;
    },
    enumerable: false
  });

  Object.defineProperty(this,"newGame",{
    value:function(pGameType) {
      console.log("newGame", pGameType)
      var gameKey = _app.accessCode;
      var players = [{ key:_app.user.key, name:_app.user.name }];
      if ((typeof pGameType == "string") && (pGameType != "") && (typeof _var.gameConfigs[pGameType] == "object")) {
        _var.game = new Game(_app, pGameType, { hostKey:_app.user.key, dealerKey:_app.user.key, players:[] });
        _var.game.init();
        console.log(_var.game)
      }
      return _var.game;
    },
    enumerable: false
  });

  Object.defineProperty(this,"joinGame",{
    value:function(gameCode) {
      console.log("joinGame")
      //TODO: Add code to to join an existing game
      _var.game = "";
      this.applyTemplate("gamearea", _app, "#gamearea");
      $("#dlgGames").modal("show");
      return null;
    },
    enumerable: false
  });

  Object.defineProperty(this,"applyTemplate",{
    value:function(template, context, target, method) {
      //templateId the id of pre-compiled template to be executed
      var templateId = (typeof template == "string") ? template : "";
      var tpl;
      if (typeof _var.templates[templateId] === "function") {
        //if pre-compiled template exists, then use it
        tpl = _var.templates[templateId];
      } else if (document.getElementById(templateId + "-template")) {
        //If document contains template source, compile, use it and save to pre-compiled
        tpl = Handlebars.compile($(("#" + templateId + "-template")).html());
        _var.templates[templateId] = tpl;
      } else if (templateId != "") {
        //If template arg is non-empty string, compile and use as 1-time template
        tpl = Handlebars.compile(templateId);
      }
      //now return the resulting html or empty string if still no template
      var html = (typeof tpl == "function") ? tpl({ ctx:context, app:_app }) : "";
      var $t = ((typeof target == "string") && (target != "")) ? $(target) : target;
      var m = ((typeof method == "string") && (method != "")) ? method : "html";
      //target was specified with valid method or no method then apply html to matching elements
      if ($t && (typeof $t[m] === "function")) {
        $t[m](html);
      }
      return html;
    },
    enumerable: false
  });

  Object.defineProperty(this,"refreshUI",{
    value:function(refreshAll) {
      if (typeof _var.user == "object") {
        _var.user.refreshUI(refreshAll);
      }
      if (typeof _var.room == "object") {
        _var.room.refreshUI(refreshAll);
      }
      if (typeof _var.game == "object") {
        _var.game.refreshUI(refreshAll);
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"resetGame",{
    value:function(gameType, keepPlayers) {
      var roomKey = (typeof _app.room === "object") ? _app.room.key : "";
      var players = ((keepPlayers === true) && (_var.game === "object")) ? _var.game.players : [];
      if (typeof _app.gameConfigs[gameType] === "object") {
        _var.game = new Game(_app, gameType, { key:roomKey, players:players });
      } else {
        _var.game = undefined;
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"prefix",{
    /**
     * Summary: Checks if the passed state object meets any or all of passed condition filters
     **/
    value: function (pSourceObject, pPrefix, pSkip, pExpand) {
      var src = pSourceObject;
      var obj = {};
      var skip = (Array.isArray(pSkip)) ? pSkip : [];
      var expand = ((typeof pExpand === "object") && (!Array.isArray(pExpand))) ? pExpand : {};
      var prefix = (!!pPrefix) ? pPrefix : "";
      var propNames = Object.getOwnPropertyNames(src);
      if (propNames.length === 0) {
        propNames = Object.keys(src);
      }
      Object.getOwnPropertyNames(src).forEach(function(k){
        if (skip.indexOf(k) === -1) {
          switch (typeof src[k]) {
            case "symbol": break;
            case "function": break;
            case "undefined": break;
            case "object":
              if (Array.isArray(src[k])) {
                //if an array return the length
                obj[prefix + k] = src[k].length;
              } else if (typeof expand[k] === "string") {
                //otherwise expand if in expand hash
                Object.assign(obj, _app.prefix(src[k], expand[k]));
              }
              //special case for owner add as true/false based on match of current user
              if ((k === "owner") && (typeof src[k].key === "string")) {
                obj["owner"] = (_app.user && _app.user.key && (src[k].key === _app.user.key));
              }
              break;
            default:
              obj[prefix + k] = src[k];
          }
        }
      });

      return obj;
    },
    enumerable:false
  });

  Object.defineProperty(this,"check",{
    /**
     * Summary: Checks if the passed state object meets any or all of passed condition filters
     **/
    value: function(pState, pConditionSets, pMatchAll) {

      var k, filter;
      var filters = (Array.isArray(pConditionSets)) ? pConditionSets : (typeof pConditionSets === "object") ? [pConditionSets] : [];
      var chkItem = pState;
      var matched = false;
      var allMatched = true;
      var matchAll = ((pMatchAll === true) || (filters.length === 0));
      var filterIndex = 0;

      //short circuit if any one filter matches completely
      while((filterIndex < filters.length) && ((!matched) || (matchAll && allMatched))){
        filter = filters[filterIndex];
        matched = true; //default to matching

        //check if item meets all conditions in filter
        for (k in filter) {
          var cmpVal = filter[k];
          var itemVal = chkItem[k];
          switch (typeof cmpVal) {
            case "boolean":
              matched = matched && (cmpVal === Boolean(itemVal));
              break;
            case "function":
              matched = matched && (Boolean(cmpVal(itemVal)));
              break;
            case "object":
              if (Array.isArray(cmpVal) && (cmpVal.length === 2) && (typeof itemVal === "number")) {
                matched = ((itemVal >= cmpVal[0]) && (itemVal <= cmpVal[1]));
              } else {
                console.log("Invalid Object", cmpVal, itemVal);
              }
              break;
            case "number":
              if (typeof chkItem[k] === "number") {
                matched = (filter[k] < 0) ? (chkItem[k] <= (-1 * filter[k])) : (chkItem[k] === filter[k]);
              } else {
                console.log("NaN", cmpVal, itemVal);
              }
              break;
            default:
              matched = matched && (filter[k] === chkItem[k]);
              break;
          }
        } //end for k in filter

        allMatched = allMatched && matched;

        //increment index to check next filter
        filterIndex++;

      } //end while

      //return result based on whether we were matching all or any filter conditions
      return (matchAll) ? allMatched : matched;

    },
    enumerable: false
  });

  Object.defineProperty(this,"getObject",{
    //resolves an object based on type and key
    //works on both client and server
    value:function(pClass, pKey, userKey, roomKey) {
      var target;
      var user = (typeof userKey !== "string") ? _app.user : (typeof _app.users === "object") ? _app.users[userKey] : ((typeof _app.user === "object") && (_app.user.key === userKey)) ? _app.user : undefined;
      var room = (typeof roomKey !== "string") ? _app.room : (typeof _app.rooms === "object") ? _app.rooms[roomKey] : ((typeof _app.room === "object") && (_app.room.key === roomKey)) ? _app.room : undefined;
      switch (pClass) {
        case "app": target = _app; break;
        case "profile": target = user; break;
        case "user": target = (typeof room === "object") ? room.users[pKey] : (typeof _app.users === "object") ? _app.users[pKey] : undefined; break;
        case "card": if (typeof _app.game === "object")  { target = _app.game.getCard(pKey); }; break;
        case "stack": if (typeof _app.game === "object") { target = _app.game.getStack(pKey); }; break;
        case "player": if (typeof _app.game === "object") { target = _app.game.getPlayer(pKey); }; break;
        case "game": if (typeof _app.game === "object") { target = _app.game; } break;
        case "room": if (typeof _app.room === "object") { target = _app.room; } break;
        default: break;
      }
      return target;
    },
    enumerable: false
  });

  if (_var.key === "SERVER") {
    Object.defineProperty(this,"init",{
      value:function(gameId) {},
      enumerable: false
    });
  } else {
    Object.defineProperty(this,"init",{
      value:function(gameId) {
        Handlebars.registerHelper('part', function (list, options) {
          var opt = Object.assign({ sep:"|", index:0 }, options.hash)
          var parts = (Array.isArray(list)) ? list : (typeof list == "string") ? list.split(opt.sep) : [];
          return (parts.length > opt.index) ? parts[opt.index] : "";
        })

        Handlebars.registerHelper('ordinal', function (number, options) {
          var opt = Object.assign({ isIndex:true, html:true }, options.hash)
          var num = (opt.isIndex) ? (number + 1) : number;
          var ord = "th";
          switch (num % 10) {
            case 1: ord = (num == 11) ? "th" : "st"; break;
            case 2: ord = (num == 12) ? "th" : "nd"; break;
            case 3: ord = (num == 13) ? "th" : "rd"; break;
          }
          return (opt.html) ? new Handlebars.SafeString("" + num + "<sup>" + ord + "</sup>") : "" + num + ord;
        })

        //*** Initialize user data
        if (_var.user !== "object") {
          _var.user = new User (_app, { name:this.randomName() });
        }

        this.applyTemplate("gamearea", this, "#gamearea");

        if (typeof _var.room !== "object") {
          $("#dlgUserSettings").modal("show");
        }

        _app.io.emit("initUser", _var.user.state);

        /*** Display chatMessage recieved from server ****/
        _app.io.on('chatMessage', function(pMessage){
          _app.post(pMessage);
        });

        _app.io.on('initGame', function(pData){
          if ((typeof _app.game !== "object") || (_app.game.gameType !== pData.gameType)) {
            _app.room.gameType = pData.gameType;
            _app.game = new Game(_app, pData.gameType);
          }
          _app.game.init(pData);
          _app.post({title:"New Game", text:"Starting new game."});
        });

        _app.io.on('initRoom', function(pConfig){
          _app.room = (typeof pConfig === "object") ? new Room(_app, pConfig) : undefined;
          //console.log("initRoom", _app.room);
        });

        _app.io.on('showDialog', function(pId){
          var sel = (typeof pId !== "string") ? "" : (pId.substr(0,1) != "#") ? "#" + pId : pId;
          $(sel).modal('show');
        });

        /*** Synchronizes states of Application, User, Room, Game, Card, Stack and Player objects ****/
        socket.on('state', function(pClass, pKey, pData){
          var obj = _app.getObject(pClass, pKey);
          //update state of local object if one exists
          if (typeof obj === "object") {
            obj.state = pData;
            //console.log("io.on.state", pClass, pKey, pData);
          } else {
            console.log("unsupported object", pClass, pKey, pData)
          }
        });


        /*** Adds a User to the current/specified Room ****/
        socket.on('addUser', function(pConfig){
          var room = _app.room;
          var userData = pConfig;
          //console.log(room, userData)
          if ((typeof room === "object") && (typeof userData.key === "string") && (userData.key !== "")) {
            //use room property to just update the LOCAL copy
            room.addUser(userData, true)
          }
        })

        /*** Removes a User from the current/specified Room ****/
        socket.on('removeUser', function(userKey){
          //accepts either userKey or { user:(key or Object), room(key or Object)}
          var room = _app.room;
          if ((typeof room === "object") && (typeof pUserKey === "string") && (pUserKey !== "")) {
            //use room property to just update the LOCAL copy
            room.removeUser(pUserKey, true)
          }
        });

      },
      enumerable: false
    });

  }

  _var.emojis = [
    { alt:"grinning face", hex:"1f600", html:"&#x1f600;", char:"\u1f600" },
    { alt:"beaming smiling eyes face", hex:"1f601", html:"&#x1f601;", char:"\u1f601" },
    { alt:"tears of joy face", hex:"1f602", html:"&#x1f602;", char:"\u1f602" },
    { alt:"grinning big eyes face", hex:"1f603", html:"&#x1f603;", char:"\u1f603" },
    { alt:"grinning smiling eyes face", hex:"1f604", html:"&#x1f604;", char:"\u1f604" },
    { alt:"grinning sweat face", hex:"1f605", html:"&#x1f605;", char:"\u1f605" },
    { alt:"grinning squinting face", hex:"1f606", html:"&#x1f606;", char:"\u1f606" },
    { alt:"tongue out face", hex:"1f61b", html:"&#x1f61b;", char:"\u1f61b" },
    { alt:"winking face tongue", hex:"1f61c", html:"&#x1f61c;", char:"\u1f61c" },
    { alt:"thinking face", hex:"1f914", html:"&#x1f914;", char:"\u1f914" },
    { alt:"neutral face", hex:"1f610", html:"&#x1f610;", char:"\u1f610" },
    { alt:"rolling eyes face", hex:"1f644", html:"&#x1f644;", char:"\u1f644" },
    { alt:"relieved face", hex:"1f60c", html:"&#x1f60c;", char:"\u1f60c" },
    { alt:"bandaged face", hex:"1f915", html:"&#x1f915;", char:"\u1f915" },
    { alt:"dizzy face", hex:"1f635", html:"&#x1f635;", char:"\u1f635" },
    { alt:"open mouth face", hex:"1f62e", html:"&#x1f62e;", char:"\u1f62e" },
    { alt:"astonished face", hex:"1f632", html:"&#x1f632;", char:"\u1f632" },
    { alt:"steam from nose face", hex:"1f624", html:"&#x1f624;", char:"\u1f624" },
    { alt:"angry face", hex:"1f620", html:"&#x1f620;", char:"\u1f620" },
    { alt:"poop emoji", hex:"1f4a9", html:"&#x1f4a9;", char:"\u1f4a9" },
    { alt:"bomb emoji", hex:"1f4a3", html:"&#x1f4a3;", char:"\u1f4a3" },
    { alt:"heart eyes face", hex:"1f60d", html:"&#x1f60d;", char:"\u1f60d" },
    { alt:"halo face", hex:"1f607", html:"&#x1f607;", char:"\u1f607" },
    { alt:"pout face", hex:"1f621", html:"&#x1f621;", char:"\u1f621" },
    { alt:"smiling devil face", hex:"1f608", html:"&#x1f608;", char:"\u1f608" },
    { alt:"frowning devil face", hex:"1f47f", html:"&#x1f47f;", char:"\u1f47f" },
    { alt:"zipper mouth face", hex:"1f910", html:"&#x1f910;", char:"\u1f910" },
    { alt:"sunglasses face", hex:"1f60e", html:"&#x1f60e;", char:"\u1f60e" }
  ];



  //add game configs
  _var.gameConfigs = {
    euchre:{
      id:"euchre",
      title:"Euchre",
      minPlayers:4,
      maxPlayers:4,
      trumps:["spades","diamonds","clubs","hearts"],
      decks:{ euchre:1 },
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "shared", "everyone" ] ],
      chat:["Pass|\u{1f44b}","Pick it up!|\u{1f44d}","I'm going alone!|\u{1f60e}","Spades|\u2660|club","Diamonds|\u2666|diamond","Clubs|\u2663|club","Hearts|\u2665|heart"],
      gameMenu:[
        {key:"scores", label:"Scores", fn:"showDialog", obj:"game", filter:{ }, options:{ dialog:"dlgScores" }},
        {key:"rules", label:"Rules", fn:"showDialog", obj:"game", filter:{ }, options:{ dialog:"dlgRules" }},
        {key:"players", label:"Players", fn:"showDialog", obj:"game", filter:{ dealer:true }, options:{ dialog:"dlgPlayers" }},
        "",
        {key:"new_game", label:"New Game", fn:"showDialog", obj:"game", filter:{ host:true }, options:{ }},
        {key:"new_deal", label:"New Deal", fn:"newGame", obj:"game", filter:{ host:true }, options:{ }},
        {key:"leave_game", label:"Leave Game", fn:"leave", obj:"game", options:{ }}
      ],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"noone", layout:"stack", face:"down", cardAction:"none"},
        { key:"shared", label:"Table", shared:true, viewable:true, actionable:"everyone", layout:"fan", face:"up", initUp:1, cardAction:"none", actions:[
          { key:"orderUp", label:"Order up", action:"give", actionFilter:{ upCards:1, cards:1, player_dealer:false }, stackFilter:{ group:"hand", owner_dealer:true }, cardFilter:{ face:'up' }, cardFace:"down" },
          { key:"pickUp", label:"Pick up", action:"give", actionFilter:{ upCards:1, cards:1, player_dealer:true }, stackFilter:{ group:"hand", owner_dealer:true }, cardFilter:{ face:'up' }, cardFace:"down" },
          { key:"turnDown", label:"Turn down", action:"flip", actionFilter:{ upCards:1, cards:1, player_dealer:true }, cardFace:"down" },
          { key:"claim", label:"Claim", action:"give", actionFilter:{ upCards:4, cards:4 }, stackFilter:{ group:"tricks", owner:true }, cardFace:"down" }
        ]},
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initDown:5, sort:"suit", cardAction:"menu",
          cardActions:[
            { key:"discard", label:"Discard", action:"give", actionFilter:{ selectedCards:1, cards:6, player_dealer:true }, stackFilter:{ group:"deck" }, cardFace:"down" },
            { key:"play", label:"Play", action:"give", actionFilter:{ selectedCards:1, cards:-5 }, stackFilter:{ group:"shared" }, cardFace:"down" }
          ]
        },
        { key:"tricks", label:"Tricks", shared:false, viewable:true, actionable:"noone", layout:"fan", face:"down", cardAction:"none" }
      ]
    },
    quiddler:{
      id:"quiddler",
      title:"Quiddler",
      minPlayers:2,
      maxPlayers:8,
      decks:{ quiddler:1 },
      css:".card-item::after { display:none !important; } .card-face {background-image:url(/img/quiddler.png) !important; border-style:none !important; } .card-face::after { display:none !important; }",
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "deck", "everyone" ], ["*[area='t1']", "discard", "everyone" ], ["*[area='t2']", "words", "everyone" ], ["*[area='t3']", "unused", "everyone" ] ],
      chat:[],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"everyone", layout:"stack", face:"down", cardAction:"menu", actions:[
          { key:"deal3", label:"Deal 3", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:3 },
          { key:"deal4", label:"Deal 4", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:4 },
          { key:"deal5", label:"Deal 5", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:5 },
          { key:"deal6", label:"Deal 6", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:6 },
          { key:"deal7", label:"Deal 7", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:7 },
          { key:"deal8", label:"Deal 8", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:8 },
          { key:"deal9", label:"Deal 9", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:9 },
          { key:"deal10", label:"Deal 10", action:"deal", stackFilter:{ group:"hand" }, cardFace:"down", numCards:10 },
        ], cardActions:[
          { key:"draw", label:"Draw", action:"give", stackFilter:{ group:"hand", owner:true }, cardFace:"down" },
        ] },
        { key:"discard", label:"Discard", shared:true, viewable:true, actionable:"everyone", layout:"stack", face:"up", initUp:1, cardAction:"menu", cardActions:[
          { key:"pickUp", label:"Pick up", action:"give", stackFilter:{ group:"hand", owner:true }, cardFace:"down" }
        ] },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initDown:0, cardAction:"first", actions:[
          { key:"discard", label:"Discard", action:"give", actionFilter:{ selectedCards:1, owner:true }, stackFilter:{ group:"discard" }, cardFilter:{ selected:true }, cardFace:"up" },
          { key:"play", label:"Play word", action:"give", actionFilter:{ selectedCards:[2,10], owner:true }, stackFilter:{ group:"words", owner:true }, cardFace:"up" },
          { key:"unplayed", label:"No more words", action:"give", actionFilter:{ owner:true }, stackFilter:{ group:"unused", owner:true }, cardFace:"up" }
        ] },
        { key:"words", label:"Words", shared:false, viewable:true, actionable:"noone", layout:"fan", face:"up", cardAction:"none" },
        { key:"unused", label:"Unused", shared:false, viewable:true, actionable:"noone", layout:"fan", face:"up", cardAction:"none" }
      ]
    },
    holdem:{
      id:"holdem",
      title:"Texas Hold'em",
      minPlayers:2,
      maxPlayers:8,
      decks:{ full:1 },
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "shared", "everyone" ], ["*[area='t2']", "hand", "everyone" ] ],
      chat:["Fold","Check","Call","Raise","I'm all in!"],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"noone", layout:"stack", face:"down", cardAction:"none", actions:[] },
        { key:"shared", label:"Community", shared:true, viewable:true, actionable:"dealer", layout:"fan", face:"down", cardAction:"none", actions:[
          { key:"flop", label:"Flop", action:"deal", stackFilter:{ group:"shared" }, cardFace:"up", numCards:3 },
          { key:"turn", label:"Turn", action:"deal", stackFilter:{ group:"shared" }, cardFace:"up" },
          { key:"river", label:"River", action:"deal", stackFilter:{ group:"shared" }, cardFace:"up" },
          { key:"reveal", label:"Reveal Hands", action:"flip", actionFilter:[{ player_dealer:true }], stackFilter:{ group:"hand" }, cardFace:'up' }
        ] },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initDown:2, cardAction:"none", actions:[
          { key:"fold", label:"Fold", action:"fold", actionFilter:[] },
          { key:"bet", label:"Bet &hellip;", action:"betDialog" },
          { key:"check", label:"Check", action:"betMin", actionFilter:{ callAmount:false, betAmount:false } },
          { key:"call", label:"Call", action:"betMin", actionFilter:[{ callAmount:true  }, { betAmount:true }] },
          { key:"allIn", label:"All In!", action:"betMax", actionFilter:[{ betAmount:true }] }
        ] }
      ]
    },
    cross:{
      id:"cross",
      title:"Iron Cross",
      minPlayers:2,
      maxPlayers:8,
      decks:{ full:1 },
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "shared", "everyone" ], ["*[area='t2']", "hand", "everyone" ] ],
      chat:["Fold","Check","Call","Raise","I'm all in!"],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"dealer", layout:"stack", face:"down", cardAction:"none", actions:[
          { key:"deal", label:"Deal", action:"give", stackFilter:{ group:"shared" }, cardFace:"down", cards:5 },
          { key:"reveal", label:"Reveal Hands", action:"flip", actionFilter:[{ player_dealer:true }], stackFilter:{ group:"hand" }, cardFace:'up' }
        ] },
        { key:"shared", label:"Community", shared:true, viewable:true, actionable:"everyone", layout:"cross", face:"down", initDown:5, cardAction:"flip" },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initDown:2, cardAction:"none", actions:[
          { key:"fold", label:"Fold", action:"fold", actionFilter:[] },
          { key:"bet", label:"Bet &hellip;", action:"betDialog" },
          { key:"check", label:"Check", action:"betMin", actionFilter:{ callAmount:false, betAmount:false } },
          { key:"call", label:"Call", action:"betMin", actionFilter:[{ callAmount:true  }, { betAmount:true }] },
          { key:"allIn", label:"All In!", action:"betMax", actionFilter:[{ betAmount:true }] }
        ] }
      ]
    },
    draw5:{
      id:"draw5",
      title:"5-card Draw",
      minPlayers:2,
      maxPlayers:6,
      decks:{ full:1 },
      jokers:2,
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "deck", "dealer" ], ["*[area='t2']", "hand", "everyone" ] ],
      chat:["Fold","Check","Call","Raise"],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"dealer", layout:"stack", face:"down", cardAction:"none", actions:[
          { key:"deal", label:"Deal", action:"give", actionFilter:{ player_dealer:true }, stackFilter:{ group:"shared" }, cardFace:"down", cards:5 },
          { key:"reveal", label:"Reveal Hands", action:"flip", actionFilter:{ player_dealer:true }, stackFilter:{ group:"hand" }, cardFace:'up' }
        ] },
        { key:"discard", label:"Discard", shared:true, viewable:true, actionable:"dealer", layout:"stack", face:"down", cardAction:"none" },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initDown:5, sort:"rank", cardAction:"select", actions:[
          { key:"draw", label:"Draw", action:"replace", actionFilter:{ numSelect:[1,4],  bidCount:1 }, stackFilter:{ group:"deck" }, cardFilter:{ selected:true } },
          { key:"fold", label:"Fold", action:"fold", actionFilter:[] },
          { key:"bet", label:"Bet &hellip;", action:"betDialog" },
          { key:"check", label:"Check", action:"betMin", actionFilter:{ callAmount:false, betAmount:false } },
          { key:"call", label:"Call", action:"betMin", actionFilter:[{ callAmount:true  }, { betAmount:true }] },
          { key:"allIn", label:"All In!", action:"betMax", actionFilter:[{ betAmount:true }] }
        ] }
      ]
    },
    stud7:{
      id:"stud7",
      title:"7-card Stud",
      minPlayers:2,
      maxPlayers:7,
      decks:{ full:1 },
      display:[ ["*[area='p1']", "hand", "owner" ], ["*[area='t1']", "deck", "dealer" ], ["*[area='t2']", "hand", "everyone" ] ],
      chat:["Fold","Check","Call","Raise"],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"dealer", layout:"stack", face:"down", cardAction:"none", actions:[
          { key:"deal", label:"Deal", action:"give", actionFilter:{ player_dealer:true }, stackFilter:{ group:"hand" }, cardFace:"up", cards:1 },
          { key:"reveal", label:"Reveal Hands", action:"flip", actionFilter:{ player_dealer:true }, stackFilter:{ group:"hand" }, cardFace:'up' }
        ] },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"fan", face:"down", initUp:3, initDown:2, cardAction:"select", actions:[
          { key:"fold", label:"Fold", action:"fold", actionFilter:[] },
          { key:"bet", label:"Bet &hellip;", action:"betDialog" },
          { key:"check", label:"Check", action:"betMin", actionFilter:{ callAmount:false, betAmount:false } },
          { key:"call", label:"Call", action:"betMin", actionFilter:[{ callAmount:true  }, { betAmount:true }] },
          { key:"allIn", label:"All In!", action:"betMax", actionFilter:[{ betAmount:true }] }
        ] }
      ]
    },
    sweat:{
      id:"sweat",
      title:"7-card Sweat",
      minPlayers:2,
      maxPlayers:7,
      decks:{ full:1 },
      display:[ ["*[area='t1']", "shared", "dealer" ], ["*[area='t2']", "hand", "everyone" ] ],
      chat:["Beat that!","Fold","Check","Call","Raise"],
      stacks:[
        { key:"deck", label:"Deck", shared:true, viewable:true, actionable:"dealer", layout:"stack", face:"down", cardAction:"none" },
        { key:"shared", label:"Card to Beat", shared:true, viewable:true, actionable:"noone", layout:"stack", face:"up", initUp:1, cardAction:"none" },
        { key:"hand", label:"Hand", shared:false, viewable:true, actionable:"owner", layout:"stack-fan", face:"down", initDown:7, cardAction:"flip", actions:[
          { key:"fold", label:"Fold", action:"fold", actionFilter:[] },
          { key:"bet", label:"Bet &hellip;", action:"betDialog" },
          { key:"check", label:"Check", action:"betMin", actionFilter:{ callAmount:false, betAmount:false } },
          { key:"call", label:"Call", action:"betMin", actionFilter:[{ callAmount:true  }, { betAmount:true }] },
          { key:"allIn", label:"All In!", action:"betMax", actionFilter:{ betAmount:true } }
        ] }
      ]
    }
  };

  _var.deckConfigs = {
    quiddler:
    [
      {id:'c01',t:'A',p:2,n:10,x:1,y:0},
      {id:'c02',t:'B',p:8,n:2,x:2,y:0},
      {id:'c03',t:'C',p:8,n:2,x:3,y:0},
      {id:'c04',t:'CL',p:10,n:2,x:4,y:0},
      {id:'c05',t:'D',p:5,n:4,x:5,y:0},
      {id:'c06',t:'E',p:2,n:12,x:6,y:0},
      {id:'c07',t:'ER',p:7,n:2,x:7,y:0},
      {id:'c08',t:'F',p:6,n:2,x:8,y:0},
      {id:'c09',t:'G',p:6,n:4,x:9,y:0},
      {id:'c10',t:'H',p:7,n:2,x:10,y:0},
      {id:'c11',t:'I',p:2,n:8,x:11,y:0},
      {id:'c12',t:'IN',p:7,n:2,x:12,y:0},
      {id:'c13',t:'J',p:13,n:2,x:13,y:0},
      {id:'c14',t:'K',p:8,n:2,x:14,y:0},
      {id:'c15',t:'L',p:3,n:4,x:15,y:0},
      {id:'c16',t:'M',p:5,n:2,x:16,y:0},
      {id:'c17',t:'N',p:5,n:6,x:17,y:0},
      {id:'c18',t:'O',p:2,n:8,x:18,y:0},
      {id:'c19',t:'P',p:6,n:2,x:19,y:0},
      {id:'c20',t:'Q',p:15,n:2,x:20,y:0},
      {id:'c21',t:'QU',p:9,n:2,x:21,y:0},
      {id:'c22',t:'R',p:5,n:6,x:22,y:0},
      {id:'c23',t:'S',p:3,n:4,x:23,y:0},
      {id:'c24',t:'T',p:3,n:6,x:24,y:0},
      {id:'c25',t:'TH',p:9,n:2,x:25,y:0},
      {id:'c26',t:'U',p:4,n:6,x:26,y:0},
      {id:'c27',t:'V',p:11,n:2,x:27,y:0},
      {id:'c28',t:'W',p:10,n:2,x:28,y:0},
      {id:'c29',t:'X',p:12,n:2,x:29,y:0},
      {id:'c30',t:'Y',p:4,n:4,x:30,y:0},
      {id:'c31',t:'Z',p:14,n:2,x:31,y:0}
    ],
    jokers:
    [
      {id:'c12605',t:'Joker',s:'\u2605',r:'W',x:2,y:0,icon:'\u{1f0df}'},
      {id:'c12606',t:'Joker*',s:'\u2606',r:'W',x:3,y:0,icon:'\u{1f0df}'}
    ],
    full:
    [
      {id:'c1f0a2',t:'Two of Spades',s:'\u2660',r:'2',x:0,y:1,icon:'\u{1f0a2}'},
      {id:'c1f0a3',t:'Three of Spades',s:'\u2660',r:'3',x:1,y:1,icon:'\u{1f0a3}'},
      {id:'c1f0a4',t:'Four of Spades',s:'\u2660',r:'4',x:2,y:1,icon:'\u{1f0a4}'},
      {id:'c1f0a5',t:'Five of Spades',s:'\u2660',r:'5',x:3,y:1,icon:'\u{1f0a5}'},
      {id:'c1f0a6',t:'Six of Spades',s:'\u2660',r:'6',x:4,y:1,icon:'\u{1f0a6}'},
      {id:'c1f0a7',t:'Seven of Spades',s:'\u2660',r:'7',x:5,y:1,icon:'\u{1f0a7}'},
      {id:'c1f0a8',t:'Eight of Spades',s:'\u2660',r:'8',x:6,y:1,icon:'\u{1f0a8}'},
      {id:'c1f0a9',t:'Nine of Spades',s:'\u2660',r:'9',x:7,y:1,icon:'\u{1f0a9}'},
      {id:'c1f0aa',t:'Ten of Spades',s:'\u2660',r:'10',x:8,y:1,icon:'\u{1f0aa}'},
      {id:'c1f0ab',t:'Jack of Spades',s:'\u2660',r:'J',x:9,y:1,icon:'\u{1f0ab}'},
      {id:'c1f0ad',t:'Queen of Spades',s:'\u2660',r:'Q',x:10,y:1,icon:'\u{1f0ad}'},
      {id:'c1f0ae',t:'King of Spades',s:'\u2660',r:'K',x:11,y:1,icon:'\u{1f0ae}'},
      {id:'c1f0a1',t:'Ace of Spades',s:'\u2660',r:'A',x:12,y:1,icon:'\u{1f0a1}'},
      {id:'c1f0b2',t:'Two of Hearts',s:'\u2665',r:'2',x:0,y:2,icon:'\u{1f0b2}'},
      {id:'c1f0b3',t:'Three of Hearts',s:'\u2665',r:'3',x:1,y:2,icon:'\u{1f0b3}'},
      {id:'c1f0b4',t:'Four of Hearts',s:'\u2665',r:'4',x:2,y:2,icon:'\u{1f0b4}'},
      {id:'c1f0b5',t:'Five of Hearts',s:'\u2665',r:'5',x:3,y:2,icon:'\u{1f0b5}'},
      {id:'c1f0b6',t:'Six of Hearts',s:'\u2665',r:'6',x:4,y:2,icon:'\u{1f0b6}'},
      {id:'c1f0b7',t:'Seven of Hearts',s:'\u2665',r:'7',x:5,y:2,icon:'\u{1f0b7}'},
      {id:'c1f0b8',t:'Eight of Hearts',s:'\u2665',r:'8',x:6,y:2,icon:'\u{1f0b8}'},
      {id:'c1f0b9',t:'Nine of Hearts',s:'\u2665',r:'9',x:7,y:2,icon:'\u{1f0b9}'},
      {id:'c1f0ba',t:'Ten of Hearts',s:'\u2665',r:'10',x:8,y:2,icon:'\u{1f0ba}'},
      {id:'c1f0bb',t:'Jack of Hearts',s:'\u2665',r:'J',x:9,y:2,icon:'\u{1f0bb}'},
      {id:'c1f0bd',t:'Queen of Hearts',s:'\u2665',r:'Q',x:10,y:2,icon:'\u{1f0bd}'},
      {id:'c1f0be',t:'King of Hearts',s:'\u2665',r:'K',x:11,y:2,icon:'\u{1f0be}'},
      {id:'c1f0b1',t:'Ace of Hearts',s:'\u2665',r:'A',x:12,y:2,icon:'\u{1f0b1}'},
      {id:'c1f0c2',t:'Two of Diamonds',s:'\u2666',r:'2',x:0,y:3,icon:'\u{1f0c2}'},
      {id:'c1f0c3',t:'Three of Diamonds',s:'\u2666',r:'3',x:1,y:3,icon:'\u{1f0c3}'},
      {id:'c1f0c4',t:'Four of Diamonds',s:'\u2666',r:'4',x:2,y:3,icon:'\u{1f0c4}'},
      {id:'c1f0c5',t:'Five of Diamonds',s:'\u2666',r:'5',x:3,y:3,icon:'\u{1f0c5}'},
      {id:'c1f0c6',t:'Six of Diamonds',s:'\u2666',r:'6',x:4,y:3,icon:'\u{1f0c6}'},
      {id:'c1f0c7',t:'Seven of Diamonds',s:'\u2666',r:'7',x:5,y:3,icon:'\u{1f0c7}'},
      {id:'c1f0c8',t:'Eight of Diamonds',s:'\u2666',r:'8',x:6,y:3,icon:'\u{1f0c8}'},
      {id:'c1f0c9',t:'Nine of Diamonds',s:'\u2666',r:'9',x:7,y:3,icon:'\u{1f0c9}'},
      {id:'c1f0ca',t:'Ten of Diamonds',s:'\u2666',r:'10',x:8,y:3,icon:'\u{1f0ca}'},
      {id:'c1f0cb',t:'Jack of Diamonds',s:'\u2666',r:'J',x:9,y:3,icon:'\u{1f0cb}'},
      {id:'c1f0cd',t:'Queen of Diamonds',s:'\u2666',r:'Q',x:10,y:3,icon:'\u{1f0cd}'},
      {id:'c1f0ce',t:'King of Diamonds',s:'\u2666',r:'K',x:11,y:3,icon:'\u{1f0ce}'},
      {id:'c1f0c1',t:'Ace of Diamonds',s:'\u2666',r:'A',x:12,y:3,icon:'\u{1f0c1}'},
      {id:'c1f0d2',t:'Two of Clubs',s:'\u2663',r:'2',x:0,y:4,icon:'\u{1f0d2}'},
      {id:'c1f0d3',t:'Three of Clubs',s:'\u2663',r:'3',x:1,y:4,icon:'\u{1f0d3}'},
      {id:'c1f0d4',t:'Four of Clubs',s:'\u2663',r:'4',x:2,y:4,icon:'\u{1f0d4}'},
      {id:'c1f0d5',t:'Five of Clubs',s:'\u2663',r:'5',x:3,y:4,icon:'\u{1f0d5}'},
      {id:'c1f0d6',t:'Six of Clubs',s:'\u2663',r:'6',x:4,y:4,icon:'\u{1f0d6}'},
      {id:'c1f0d7',t:'Seven of Clubs',s:'\u2663',r:'7',x:5,y:4,icon:'\u{1f0d7}'},
      {id:'c1f0d8',t:'Eight of Clubs',s:'\u2663',r:'8',x:6,y:4,icon:'\u{1f0d8}'},
      {id:'c1f0d9',t:'Nine of Clubs',s:'\u2663',r:'9',x:7,y:4,icon:'\u{1f0d9}'},
      {id:'c1f0da',t:'Ten of Clubs',s:'\u2663',r:'10',x:8,y:4,icon:'\u{1f0da}'},
      {id:'c1f0db',t:'Jack of Clubs',s:'\u2663',r:'J',x:9,y:4,icon:'\u{1f0db}'},
      {id:'c1f0dd',t:'Queen of Clubs',s:'\u2663',r:'Q',x:10,y:4,icon:'\u{1f0dd}'},
      {id:'c1f0de',t:'King of Clubs',s:'\u2663',r:'K',x:11,y:4,icon:'\u{1f0de}'},
      {id:'c1f0d1',t:'Ace of Clubs',s:'\u2663',r:'A',x:12,y:4,icon:'\u{1f0d1}'}
    ],
    euchre:
    [
      {id:'c1f0a9',t:'Nine of Spades',s:'\u2660',r:'9',x:7,y:1,icon:'\u{1f0a9}'},
      {id:'c1f0aa',t:'Ten of Spades',s:'\u2660',r:'10',x:8,y:1,icon:'\u{1f0aa}'},
      {id:'c1f0ab',t:'Jack of Spades',s:'\u2660',r:'J',x:9,y:1,icon:'\u{1f0ab}'},
      {id:'c1f0ad',t:'Queen of Spades',s:'\u2660',r:'Q',x:10,y:1,icon:'\u{1f0ad}'},
      {id:'c1f0ae',t:'King of Spades',s:'\u2660',r:'K',x:11,y:1,icon:'\u{1f0ae}'},
      {id:'c1f0a1',t:'Ace of Spades',s:'\u2660',r:'A',x:12,y:1,icon:'\u{1f0a1}'},
      {id:'c1f0b9',t:'Nine of Hearts',s:'\u2665',r:'9',x:7,y:2,icon:'\u{1f0b9}'},
      {id:'c1f0ba',t:'Ten of Hearts',s:'\u2665',r:'10',x:8,y:2,icon:'\u{1f0ba}'},
      {id:'c1f0bb',t:'Jack of Hearts',s:'\u2665',r:'J',x:9,y:2,icon:'\u{1f0bb}'},
      {id:'c1f0bd',t:'Queen of Hearts',s:'\u2665',r:'Q',x:10,y:2,icon:'\u{1f0bd}'},
      {id:'c1f0be',t:'King of Hearts',s:'\u2665',r:'K',x:11,y:2,icon:'\u{1f0be}'},
      {id:'c1f0b1',t:'Ace of Hearts',s:'\u2665',r:'A',x:12,y:2,icon:'\u{1f0b1}'},
      {id:'c1f0c9',t:'Nine of Diamonds',s:'\u2666',r:'9',x:7,y:3,icon:'\u{1f0c9}'},
      {id:'c1f0ca',t:'Ten of Diamonds',s:'\u2666',r:'10',x:8,y:3,icon:'\u{1f0ca}'},
      {id:'c1f0cb',t:'Jack of Diamonds',s:'\u2666',r:'J',x:9,y:3,icon:'\u{1f0cb}'},
      {id:'c1f0cd',t:'Queen of Diamonds',s:'\u2666',r:'Q',x:10,y:3,icon:'\u{1f0cd}'},
      {id:'c1f0ce',t:'King of Diamonds',s:'\u2666',r:'K',x:11,y:3,icon:'\u{1f0ce}'},
      {id:'c1f0c1',t:'Ace of Diamonds',s:'\u2666',r:'A',x:12,y:3,icon:'\u{1f0c1}'},
      {id:'c1f0d9',t:'Nine of Clubs',s:'\u2663',r:'9',x:7,y:4,icon:'\u{1f0d9}'},
      {id:'c1f0da',t:'Ten of Clubs',s:'\u2663',r:'10',x:8,y:4,icon:'\u{1f0da}'},
      {id:'c1f0db',t:'Jack of Clubs',s:'\u2663',r:'J',x:9,y:4,icon:'\u{1f0db}'},
      {id:'c1f0dd',t:'Queen of Clubs',s:'\u2663',r:'Q',x:10,y:4,icon:'\u{1f0dd}'},
      {id:'c1f0de',t:'King of Clubs',s:'\u2663',r:'K',x:11,y:4,icon:'\u{1f0de}'},
      {id:'c1f0d1',t:'Ace of Clubs',s:'\u2663',r:'A',x:12,y:4,icon:'\u{1f0d1}'}
    ]
  }

  return this; //return Application object
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Application;
} else {
  window.Application = Application;
}
})();
