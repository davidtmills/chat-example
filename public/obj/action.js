(function() {

function Action (key, action, label, config) {
  //config options:
  //  key,action,label,
  //  src,target,face,
  //  minSel,maxSel,
  //  minCards,maxCards,
  //  actor

  var _isServer = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');


  //set defaults for private config settings and then extend/override with passed config
  var _var = Object.assign({key:"", action:"", label:"", src:null, target:null, face:"down", minSel:0,	maxSel:1000, minCards:0, maxCards:1000, actor:"owner"}, config);
  //now override key, action and label with passed parameters if valid
  if (typeof key == "string" && key != "") { _var.key = key; }
  if (typeof action == "string" && action != "") { _var.action = action; }
  if (typeof label == "string" && label != "") { _var.label = label; }
  //now use defaults for any missing required properties
  if (_var.key == "") { _var.key == _var.action; }
  if (_var.label == "") { _var.label == _var.action; }

  Object.defineProperty(this,"key",{
    get: function() { return _var.key; },
    enumerable: true
  });
  Object.defineProperty(this,"action",{
    get: function() { return _var.action; },
    set: function(value) { _var["action"] = "" + value; },
    enumerable: true
  });
  Object.defineProperty(this,"label",{
    get: function() { return (_var.label != "") ? _var.label : _var.action; },
    set: function(value) { _var["label"] = "" + value; },
    enumerable: true
  });
  Object.defineProperty(this,"src",{
    get: function() { return _var.src; },
    set: function(value) { _var["src"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"target",{
    get: function() { return _var.target; },
    set: function(value) { _var["target"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"face",{
    get: function() { return (_var.face != "") ? _var.face : "down"; },
    set: function(value) { _var["face"] = "" + value; },
    enumerable: true
  });
  Object.defineProperty(this,"minSel",{
    get: function() { return _var.minSel; },
    set: function(value) { _var["minSel"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"maxSel",{
    get: function() { return _var.maxSel; },
    set: function(value) { _var["maxSel"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"minCards",{
    get: function() { return _var.minCards; },
    set: function(value) { _var["minCards"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"maxCards",{
    get: function() { return _var.maxCards; },
    set: function(value) { _var["maxCards"] = value; },
    enumerable: true
  });
  Object.defineProperty(this,"actor",{
    get: function() { return (_var.actor != "") ? _var.actor : "owner"; },
    set: function(value) { _var["actor"] = "" + value; },
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
