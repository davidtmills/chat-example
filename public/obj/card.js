(function() {

var Card = function (application, config) {
  //store private reference to application
  var _app = application;
  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');

  //config options: { t(ext):"", s(uit):"", r(ank):"", u(rl):"", x:0, y:0, p:0, n(umberOfCards):1, o(rder):0, c(ss):"", "style":"", "icon":"" }
  var _var = Object.assign({ key:"", id:"", details:"", selected:false, face:"down", stack:"deck", prevStack:"", lastUpdate:Date.now(), lastRefresh:0, css:"" }, config);

  //used for sorting by rank when no explicit sort order is provided
  var _rankOrder = { "":0, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "J":11, "Jack":11, "Q":12, "Queen":12, "K":13, "King":13, "A":14, "Ace":14, "Joker":15, "W":15 };

  //set key to random unique alpha-numeric
  if (_var.key == "") {
    _var["key"] = "C";
    while (_var.key.length < 7) { _var.key += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".substr(Math.random() * 36, 1); }
  }

  Object.defineProperty(this,"key",{
    value: _var.key,
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"column",{
    value: (typeof _var.x == "number") ? _var.x : 0,
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"row",{
    value: (typeof _var.y == "number") ? _var.y : 0,
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"suit",{
    value: (typeof _var.s == "string") ? _var.s : "",
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"suitClass",{
    get: function() {
      if (_var.s == '\u2660') {
        return "spade";
      } else if (_var.s == '\u2665') {
        return "heart";
      } else if (_var.s == '\u2666') {
        return "diamond";
      } else if (_var.s == '\u2663') {
        return "club";
      } else if (_var.s == '\u2605') {
        return "black";
      } else if (_var.s == '\u2606') {
        return "red";
      } else {
        return _var.s;
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"rank",{
    value: (typeof _var.r == "string") ? _var.r : "",
    writable: false,
    enumerable: false
  });

  Object.defineProperty(this,"icon",{
    get: function() {
      return (typeof _var.icon == "string") ? _var.icon : ""; },
    set: function(value) {
      if ((typeof value == "string") && _var.icon != value) {
        _var.icon = value;
        this.lastUpdate = { icon:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"rankOrder",{
    get: function() {
      return (typeof _var.o == "number") ? _var.o : _rankOrder[_var.r]; },
    set: function(value) {
      if ((typeof value == "number") && _var["o"] != value) {
        _var.o = value;
        this.lastUpdate = { o:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"points",{
    get: function() {
      return (typeof _var.p == "number") ? _var["p"] : 0; },
    set: function(value) {
      if ((typeof value == "number") && _var["p"] != value) {
        _var.p = value;
        this.lastUpdate = { p:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"label",{
    get: function() { return ((typeof _var.t == "string") && (_var.t != "")) ? _var.t : "" + _var["r"] + _var["s"]; },
    set: function(value) {
      if ((typeof value == "string") && _var["t"] != value) {
        _var.t = value;
        this.lastUpdate = { t:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"details",{
    get: function() { return (typeof _var.details == "string") ? _var.details : ""; },
    set: function(value) {
      if ((typeof value == "string") && _var.details != value) {
        _var.details = value;
        this.lastUpdate = { details:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"selected",{
    get: function() { return (typeof _var.selected == "boolean") ? _var.selected : false; },
    set: function(value) {
      if ((typeof value == "boolean") && (_var.selected !== value)) {
        _var.selected = value;
        this.lastUpdate = { selected:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"face",{
    get: function() { return (typeof _var.face == "string" && _var.face != "") ? _var.face : (typeof _app.game.stacks(_var.stack) != "object") ? "down" : (_app.game.stacks(_var.stack).face == "up") ? "up" : "down" ; },
    set: function(pValue) {
      var value = (pValue != "up") ? "down" : "up";
      if (_var.face != value) {
        _var.face = value;
        this.lastUpdate = { face:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"css",{
    get: function() { return (typeof _var.css == "string") ? _var.css : ""; },
    set: function(value) {
      if ((typeof value == "string") && (_var.css != value)) {
        _var.css = value;
        this.lastUpdate = { css:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"styles",{
    get: function() {
      var i;
      var a = [];
      if (typeof _var.x == "number") {
        i = _var.x * -90;
        a.push("background-position-x:" + i + "px;");
      }
      if (typeof _var.y == "number") {
        i = _var.y * -135;
        a.push("background-position-y:" + i + "px;");
      }
      if ((typeof _var.u == "string") && (_var.u != "")) {
        a.push("background-image:url(" + _var.u + ");");
      }
      if ((typeof _var["styles"] == "string") && (_var["styles"] != "")) {
        a.push(_var["styles"]);
      }
      return a.join(" ");
    },
    set: function(value) {
      if ((typeof styles == "string") && (_var.styles != value)) {
        _var.styles = value;
        this.lastUpdate = { styles:value };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"menu",{
    get: function() {
      var stack = _app.game.getStack(_var.stack);
      return (typeof stack == "object") ? stack.cardMenu : "";
    },
    enumerable: false
  });

  Object.defineProperty(this,"action",{
    get: function() {
      var stack = _app.game.getStack(_var.stack);
      return (typeof stack != "object") ? "none" : (stack.actionable) ? stack.cardAction : "none";
    },
    enumerable: false
  });

  //selectable
  Object.defineProperty(this,"selectable",{
    get: function() {
      return (this.action == "none") ? false : true;
    },
    enumerable: false
  });

  Object.defineProperty(this,"stack",{
    get: function() { return (typeof _var.stack == "object") ? _var.stack : ((typeof _var.stack == "string") && (_var.stack != "")) ? _app.game.getStack(_var.stack) : ""; },
    set: function(value) {
      var stack, card, idx, cardKeys;
      var newKey = (typeof value == "object") ? value.key : (typeof value == "string") ? value : "";
      var curKey = (typeof _var.stack == "object") ? _var.stack.key : (typeof _var.stack == "string") ? _var.stack : "";
      //only update on actual change
      if (newKey != curKey) {
        card = this; //local reference to this card
        stack = _app.game.getStack(curKey); //current stack object
        //remove from previous stack if in one
        if (typeof stack == "object") {
          //try to remove from current stack
          cardKeys = stack.cardKeys.slice();
          idx = cardKeys.findIndex((v) => v == card.key);
          if (idx >= 0) {
            cardKeys.splice(idx, 1);
            stack.cardKeys = cardKeys;
          }
          _var.prevStack = curKey;
        }
        //now fetch the new stack and add card to its cards array
        stack = (newKey != "") ? _app.game.getStack(newKey) : "";
        if (typeof stack !== "object") {
          _var.stack = "";
        } else {
          _var.stack = newKey;
          cardKeys = stack.cardKeys.slice();
          if (cardKeys.findIndex((v) => v == card.key) == -1) {
            cardKeys.push(card.key);
            stack.cardKeys = cardKeys;
          }
        }
        this.lastUpdate = { stack:_var.stack, prevStack:_var.prevStack };
      }
    },
    enumerable: false
  });

  Object.defineProperty(this,"prevStack",{
    get: function() { return ((typeof _var.prevStack == "string") && (_var.prevStack != "")) ? _app.game.getStack(_var.prevStack) : ""; },
    enumerable: false
  });

  /****** STATE AN UI MANAGEMENT ******/
  Object.defineProperty(this,"toJSON",{
    value:function() {
      return this.state;
    },
    enumerable: false
  });

  Object.defineProperty(this,"state",{
    get: function() {
      var obj = { key:_var.key, face:_var.face, selected:_var.selected, stack:_var.stack, prevStack:_var.prevStack, lastUpdate:_var.lastUpdate };
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
    get: function() { return (typeof _var.lastUpdate == "number") ? _var.lastUpdate : 0 },
    set: function(pushState) {
      _var.lastUpdate = Date.now();
      switch (typeof pushState) {
        case "object":
          Object.assign(_var, pushState);
          if (_app.ready) {
            _app.io.emit("state", "card", _var.key, pushState);
          }
          break;
        case "number":
          _var.lastUpdate = pushState;
          break;
        case "boolean":
          if (pushState && _app.ready) {
            _app.io.emit("state", "card", _var.key, this.state);
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
    get: function() { return (typeof _var.lastRefresh == "number") ? _var.lastRefresh : 0 },
    enumerable: false
  });

  Object.defineProperty(this,"refreshUI",{
    value:function(forceRefresh) {
      //greater than or equal to captures initial case of both being 0
      if (_app.ready && ((forceRefresh === true) || (_var.lastUpdate >= _var.lastRefresh))) {
        $(".card-item[card='" + _var.key + "']").toggleClass("sel", _var.selected).attr("card-face", _var.face);
        _var.lastRefresh = Date.now();
      }
    },
    enumerable: false
  });


  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Card;
} else {
  window.Card = Card;
}
})();
