(function() {

function Action (application, key, label, fn, defaultOptions, staticOptions) {
  var _app = application;
  var _ctx = undefined;
  var _cfg = undefined;
  var _type = "";
  var _defaultOptions = (typeof defaultOptions === "object") ? defaultOptions : {};
  var _staticOptions = (typeof staticOptions === "object") ? staticOptions : {};

  Object.defineProperty(this,"key",{
    value: _var.key,
    enumerable: true
  });

  Object.defineProperty(this,"label",{
    value: (typeof label === "function") ? label.bind(this) : label,
    enumerable: true
  });

  Object.defineProperty(this,"fn",{
    value: fn,
    enumerable: true
  });

  Object.defineProperty(this,"context",{
    get: function() { return _ctx; },
    set: function(value) { _ctx = value; },
    enumerable: false
  });

  Object.defineProperty(this,"contextType",{
    get: function() { return _type; },
    set: function(value) { _type = value; },
    enumerable: false
  });

  Object.defineProperty(this,"config",{
    get: function() { return _cfg; },
    set: function(value) { _cfg = value; },
    enumerable: false
  });

  Object.defineProperty(this,"actorFilters",{
    get: function() { return (Array.isArray(_cfg.actor)) ? _cfg.actor : (typeof _cfg.actor === "object") ? [_cfg.actor] : []; },
    enumerable: false
  });
  Object.defineProperty(this,"actorFilters",{
    get: function() {
      var obj = [];
      if (Array.isArray(_cfg['actor'])) {
        obj = _cfg.actor;
      } else if (typeof _cfg.actor === "object") {
        obj = [_cfg.actor];
      } else if (typeof _cfg.actor === "string") {
        var parts = _cfg.cards.split("=");
        if (parts.length > 1) {
          var o = {};
          o[parts[0]] = parts[1];
          obj.push(o);
        } else {
          switch (_cfg.cards) {
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
    },
    enumerable: false
  });

  Object.defineProperty(this,"cardFilters",{
    get: function() {
      var obj = [];
      if (Array.isArray(_cfg['cards'])) {
        obj = _cfg.cards;
      } else if (typeof _cfg.cards === "object") {
        obj = [_cfg.cards];
      } else if (typeof _cfg.cards === "string") {
        //string may be simple check or a conditional group match
        var parts = _cfg.cards.split("=");
        if (parts.length > 1) {
          var o = {};
          o[parts[0]] = parts[1];
          obj.push(o);
        } else {
          switch (_cfg.cards) {
            case "up": obj.push({ face:"up" }); break;
            case "down": obj.push({ face:"down" }); break;
            case "selected": obj.push({ selected:true }); break;
            case "!selected": obj.push({ selected:false }); break;
            case "owner": obj.push({ owner:true }); break;
            case "!owner": obj.push({ owner:false }); break;
            case "prevOwner": obj.push({ prevOwner:true }); break;
            case "!prevOwner": obj.push({ prevOwner:false }); break;
            case "dealer": obj.push({ dealer:true }); break;
            case "!dealer": obj.push({ dealer:false }); break;
            case "shared": obj.push({ shared:true }); break;
            case "!shared": obj.push({ shared:false }); break;
            default: obj.push({ group:check }); break;
          }
        }
      }
      return obj;
    },
    enumerable: false
  });

  Object.defineProperty(this,"stackFilters",{
    get: function() {
      var obj = [];
      if (Array.isArray(_cfg['stacks'])) {
        obj = _cfg.stacks;
      } else if (typeof _cfg.stacks === "object") {
        obj = [_cfg.stacks];
      } else if (typeof _cfg.stacks === "string") {
        //string maybe scoped group group:scope or attribute attrName=attrVal
        var parts = _cfg.cards.split("=");
        if (parts.length > 1) {
          var o = {};
          o[parts[0]] = parts[1];
          obj.push(o);
        } else {
          parts = _cfg.stacks.split(":");
          var check = parts[parts.length - 1];
          switch (check) {
            case "owner": obj.push({ owner:true }); break;
            case "!owner": obj.push({ owner:false }); break;
            case "dealer": obj.push({ dealer:true }); break;
            case "!dealer": obj.push({ dealer:false }); break;
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
    },
    enumerable: false
  });

  Object.defineProperty(this,"compare",{
    get: function(val1, val2, doCheck) {
      var fVal = val1;
      var fType = typeof fVal;
      var sVal = val2;
      var sType = typeof sVal;
      var matched = true;
      switch (fType) {
        case "object":
          if (Array.isArray(fVal) && (fVal.length === 2)) {
            if (sType === "number") {
              matched = (matched && (sVal >= fVal[0]) && (sVal <= fVal[1]));
            } else if (Array.isArray(sVal)) {
              matched = (matched && (sVal.length >= fVal[0]) && (sVal.length <= fVal[1]));
            }
          } else if (sType === "object") {
            matched = (matched && (JSON.stringify(sVal) === JSON.stringify(fVal)));
          }
          break;
        case "boolean":
          //Truthiness check with support
          matched = (matched && (fVal === Boolean(sVal)) && ((sVal === "false") && !fVal));
          break;
        case "number":
          if (sType === "number") {
            matched = (matched && (sVal === fVal));
          } else if (Array.isArray(sVal)) {
            matched = (matched && (sVal.length === fVal));
          }
          break;
        case "string":
          matched = (matched && (sVal == fVal));
          break;
        default:
          matched = (matched && (sVal == fVal));
          break;
      } //end switch fType

      //return result
      return matched;
    },
    enumerable: false
  });


  Object.defineProperty(this,"prefixKeys",{
    get: function(pSourceObject, pPrefix, pSkip) {
      var src = pSourceObject;
      var obj = {};
      var skip = (Array.isArray(pSkip)) ? pSkip : [];
      var prefix = (tyepof pPrefix === "string") ? pPrefix : "";
      Object.keys(obj).forEach(function(k){
        if (skip.indexOf(k) === -1) {
          switch (typeof src[k]) {
            case "function": break;
            case "undefined": break;
            case "object":
              if (Array.isArray(src[k])) {
                obj[prefix + k] = src[k].length;
              }
              break;
            default:
              obj[prefix + k] = src[k];
          }
        }
        return obj;
      });
    },
    enumerable: false
  });

  Object.defineProperty(this,"cards",{
    get: function() {
      /* Properties:
        card_key, card_face, card_selected, card_stack, card_prevStack, card_lastUpdate
        stack_key, stack_group, stack_shared, stack_order, stack_layout, stack_face
        player_key, player_name, player_folded, player_dealer, player_active, player_high, player_opener, player_points, player_bank, player_pot, player_bet, player_bid, player_tricks
        owner(boolean), owner_key, owner_name, owner_folded, owner_dealer, owner_active, owner_high, owner_opener, owner_points, owner_bank, owner_pot, owner_bet, owner_bid, owner_tricks
        prevStack_key, prevStack_group, prevStack_shared, prevStack_order, prevStack_layout, prevStack_face
        prevOwner(boolean), prevOwner_key, prevOwner_name, prevOwner_folded, prevOwner_dealer, prevOwner_active, prevOwner_high, prevOwner_opener, prevOwner_points, prevOwner_bank, prevOwner_pot, prevOwner_bet, prevOwner_bid, prevOwner_tricks
      */
      var cmp, o, p
      var action = this;
      var matches = [];
      var cards = (_type === "Card") ? [_ctx.key] : (Array.isArray(_ctx["cardKeys"])) ? _ctx.cardKeys : [];
      var filters = this.stackFilters;
      var playerData = this.prefixKeys(_app.game.getPlayer(_app.user.key), "player_");
      cards.map(function(v){
        var card = _app.game.getCard(v);
        var stack = _app.game.getStack(v.stack);
        var prevStack = _app.game.getStack(v.prevStack);
        var owner = ((typeof stack === "object") && (typeof stack.owner === "object")) ? stack.owner : { key:"" };
        var prevOwner = ((typeof prevStack === "object") && (typeof prevStack.owner === "object")) ? prevStack.owner : { key:"" };
        var obj = Object.assign({}, playerData, this.prefixKeys(card, ""), this.prefixKeys(stack, "stack_"), this.prefixKeys(owner, "owner_"), this.prefixKeys(prevStack, "prevStack_"), this.prefixKeys(prevOwner, "prevOwner_"));
        obj["owner"] = (_app.user.key === owner.key);
        obj["prevOwner"] = (_app.user.key === prevOwner.key);
        return obj;
      });
      cards.forEach(function(checkCard){
        var chkCard = checkCard;
        var matched = false;
        var filterIndex = 0;
        //short circuit if any one filter matches completely
        while((filterIndex < filters.length) && (matched === false)){
          var filter = filters[filterIndex];
          matched = true; //default to matching
          //check if card meets all conditions in filter
          for (k in filter) {
            //default is to check if stack[k] matches filter[k]
            switch (k) {
              default:
                matched = matched && this.compare(filter[k], chkStack);
            } //end switch k
          } //end for k in filter
          //if all parts of filter passed add the stack to the matches
          if (matched) {
            matches.push(chkStack);
          }
          //increment index to check next filter
          filterIndex++;
        } //end while
      });
      return matches;
    },
    enumerable: false
  });

  Object.defineProperty(this,"stacks",{
    get: function() {
      var action = this;
      var matches = [];
      var stacks = Object.values(_app.game.stacks);
      var filters = this.stackFilters;
      stacks.forEach(function(checkStack){
        var chkStack = checkStack;
        var matched = false;
        var filterIndex = 0;
        //short circuit if any one filter matches completely
        while((filterIndex < filters.length) && (matched === false)){
          var filter = filters[filterIndex];
          matched = true; //default to matching
          //check if stack meets all conditions in filter
          for (k in filter) {
            //default is to check if stack[k] matches filter[k]
            switch (k) {
              default:
                matched = matched && this.compare(filter[k], chkStack);
            } //end switch k
          } //end for k in filter
          //if all parts of filter passed add the stack to the matches
          if (matched) {
            matches.push(chkStack);
          }
          //increment index to check next filter
          filterIndex++;
        } //end while
      });
      return matches;
    },
    enumerable: false
  });

  Object.defineProperty(this,"options",{
    get: function() { return Object.assign({}, _defaultOptions, _cfg["options"], _staticOptions); },
    enumerable: false
  });

  Object.defineProperty(this,"newFace",{
    value: function(card, newStack) {
      var face = "";
      switch (_cfg["face"]) {
        case "current": face = card.face; break;
        case "default": face = (typeof newStack === "object") ? newStack.face : (typeof _ctx === "object") ? _ctx.face : card.face; break;
        case "flip": face = (card.face !== "down") ? "down" : "up"; break;
        case "toggle": face = (card.face !== "down") ? "down" : "up"; break;
        case "up": face = "up"; break;
        case "down": face = "down"; break;
        default: face = (typeof newStack === "object") ? newStack.face : (typeof _ctx === "object") ? _ctx.face : card.face; break;
      }
      return face;
    },
    enumerable: false
  });

  Object.defineProperty(this,"newSelected",{
    value: function(card, newStack) {
      var sel = false;
      switch (_cfg["face"]) {
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
      return face;
    },
    enumerable: false
  });

  Object.defineProperty(this,"html",{
    get: function() { return html; },
    enumerable: false
  });

  Object.defineProperty(this,"execute",{
    value: fn.bind(this),
    enumerable: true
  });

  return this;
}

/******** EXPORT **********/
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Application;
} else {
  window.Application = Application;
}
})();
