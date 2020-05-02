/*** Client-side code ****/
$(function () {
  var socket = io();

  /****** INIT IO EVENTS ******/
  socket.on('connect', function(){
    console.log("** socket.connect", this.io.engine.id, this);
    var appKey = this.io.engine.id;
    if (typeof window._app !== "object") {
      window._timer = 0;
      window._app = new Application(appKey, this);
      //initialize the app
      _app.init();
      window.clearInterval(_timer);
      //_timer = window.setInterval(_app.refreshUI, 250);
    } else {
      window._app.key = appKey;
    }
  }); // end sock.on connect


  $('body').on('touchstart', '*[stack] .card-item[card]', function(){ $(this).addClass('pressed') })
  $('body').on('touchend', '*[stack] .card-item[card]', function(){ $(".pressed").removeClass('pressed') })

  //*** Card Click Events If Card does NOT have a dropdown menu ****/
  $('body').on('click', '*[stack] .card-item[card] .card-btn:not([data-toggle="dropdown"])', function(){
    var $card = $(this).closest('.card-item[card]');
    var cardId = $card.attr("card");
    var stackId = $card.closest("[stack]").attr("stack");
    var card = _app.game.getCard(cardId);
    var stack = _app.game.getStack(stackId);
    //set card.selected to opposite of elements current state
    //card.selected = !$card.hasClass("sel");
    var cardAction = stack["cardAction"] | "select";
    console.log("Card Action", cardAction, card, stack);
    switch (stack["cardAction"]) {
      case "none":
        card.selected = false;
        break;
      case "menu":
        //all code is in the event that shows the menu
        break;
      case "flip":
        //flip the card
        card.face = (card.face=='up') ? 'down' : 'up';
        break;
      case "select":
        card.selected = !card.selected;
        break;
      case "first":
        card.selected = !card.selected;
        if (card.selected) {
          stack.groupBy("selection");
        } else {
          stack.cards.forEach((v)=>{ _app.game.getCard(v).selected = false; })
        }
        stack.refreshUI(true);
        break;
      default:
        //todo: check actions collection on stack for a match
        if (typeof stack.stackMenu == "object") {
          if (stack.stackMenu[stack["cardAction"]]) {
            //console.log(stack.stackMenu[stack["cardAction"]]);
            //stack.execute(stack.stackMenu[act[0]]);
          }
        }
    }
    card.refreshUI(true);
  });

  //*** Main Actions Processor for Game Events ****/
  $('body').on('click', '[data-action]', function(event){
    var $btn = $(this);
    var actionId = $btn.attr("data-action");
    var $el = $(this);
    var target = $el.attr("data-target") || "";
    var $target = (target != "") ? $(target) : $el;
    var args = $el.attr("data-args") || "";
    var options, attrs, attr, attrSrc, attrDest, attrVal;
    switch (actionId) {
      case "select":
        attrs = args.split("|");
        attrs.forEach(function (v) {
          attr = v.split(":");
          attrSrc = attr[0];
          attrDest = (attr.length > 1) ? attr[1] : attrSrc;
          attrVal = "";
          switch (attrSrc) {
            case "val": attrVal = $el.val(); break;
            case "html": attrVal = $el.html(); break;
            case "text": attrVal = $el.text(); break;
            default: attrVal = $el.attr(attrSrc); break;
          }
          switch (attrDest) {
            case "val": $(target).val(attrVal); break;
            case "html": $(target).html(attrVal); break;
            case "text": $(target).text(attrVal); break;
            default: attrVal = $(target).attr(attrDest, attrVal); break;
          }
        });
        break;
      case "createRoom":
        console.log("createRoom", _app.isHost, _app.room)
        if (_app.isHost === false) {
          var users = {};
          users[_app.user.key] = _app.user.state;
          options = { hostKey:_app.user.key, users:users, title:_app.user.name + "'s Game Room" };
          $.each(this.attributes,function(i,a){
          	if (a.name.indexOf("room-") === 0) {
              options[a.name] = (a.value.indexOf("#") === 0) ? $(a.value).val() : a.value;
            }
          });
          if (typeof _app.room === "object") {
            _app.io.emit("leaveRoom", _app.room.key);
          }
          _app.room = new Room(_app, options);
          _app.io.emit("createRoom", _app.room.state);
        } else {
          console.log("Can't create room while host");
        }
        $("#dlgGames").modal("show");
        break;
      case "leaveRoom":
        _app.io.emit("leaveRoom");
        _app.room = undefined;
        _app.game = undefined;
        $("#dlgJoinGame").modal("show");
        break;
      case "joinRoom":
        attrVal = $("#joinGameCode").val().toUpperCase();
        _app.io.emit("joinRoom", { accessCode:attrVal });
        break;
      case "gameType":
        attrVal = $el.attr("game-type");
        if (_app.isHost) {
          _app.room.gameType = attrVal;
          _app.game = _app.newGame(attrVal);
          _app.io.emit("initGame", _app.game.data);
          $("#dlgGameStart").modal("show");
        } else {
          _app.io.emit("quickPlay", { gameType:attrVal })
        };
        break;
      case "newHand":
        options = {}
        //get the specified players
        var players = [];
        $("#dlgGameStart [data-prop='player'][player-key][player-name]:not([player-key=''])").each(function(index){
          players.push({ key:$(this.attr("player-key")), name:$(this.attr("player-name")) })
        });
        //get settings from dialog attributes
        $.each(document.getElementById("dlgGameStart").attributes,function(i,a){
          if (a.name.indexOf("game-") === 0) {
            options[a.name.replace("game-","")] = (a.value.indexOf("#") === 0) ? $(a.value).val() : a.value;
          }
        });
        //get the dealer key
        options["dealerKey"] = $("#dlgGameStart [dealer-key]").attr("dealer-key") || options["dealerKey"] || "";
/*
        //read settings from dlgGameStart
        $("#dlgGameStart [prop-name][prop-val]").each(function(index){
          attr = $(this.attr("prop-name"));
          attrVal = $(this).attr("prop-val");
          options[$(this).attr("prop-name")] =  (attrVal.indexOf("#") === 0) ? $(attrVal).val() : attrVal;
        })
*/
        _app.io.emit("initGame", options);
        break;

      case "newGame":
        $button = $($("#dlgGames").data("relatedTarget"));
        attrVal = $button.attr("game-type");
        if (_app.isHost) {
          _app.game = _app.newGame(attrVal);
          //socket.emit("addObject", "game", attrVal, {}, _app.game.state);
          //socket.emit("exec", "game", "", "init", []);
        } else {

        }
        break;

      case "setCardSize":
        $("body").removeClass("card-sm card-md card-lg").addClass(args);
        break;
      case "sendMessage":
        var icon = $el.attr("msg-icon") || $el.attr("emoji") || "";
        var text = $target.attr("msg-text") || $target.val() || $target.text() || $el.attr("msg-text") || "";
        var title = $el.attr("msg-title") || _app.user.name || "";
        var css = $el.attr("msg-css") || "";
        var msg = { title:title, text:text, icon:icon, css:css }
        $($el.attr("data-target")).val("");
        console.log("sendMessage", msg);
        _app.sendMessage(msg);
        break;
      case "setTrump":
        $("[propname='trump']").attr("propval", target);
        break;
    }
  });


  /*** Modal Dialogs optional template support *****/
  $('body').on('show.bs.modal', '.modal', function(event){
    //store the button that launched the dialog so we can refer to it later
    //to retrieve additional settings such as game-mode on the dlgGames dialog
    $(this).data("relatedTarget", event.relatedTarget);
    //if a template source exists or a precompiled template exists, apply to dialog before displaying
    if (document.getElementById(event.target.id + "-template") || (_app.templates[event.target.id] === "function")) {
      _app.applyTemplate(event.target.id, _app, $(event.target));
    }
  });

  /*** Stack Dropdown Menus are Dynamically-loaded *****/
  $('body').on('show.bs.dropdown', '.stack-menu', function(event){
    var $button = $(event.relatedTarget) // Button that triggered the dropdown
    var $stack = $button.closest(".stack[stack]");
    var $menu = $(this).find(".dropdown-menu");
    var stack = _app.game.getStack($stack.attr("stack"));
    var actions = stack.actions;
    actions = actions.filter((v) => stack.check(v.filter) );
    _app.applyTemplate("actionlist", actions, $menu);
  })

  //*** Dropdown Submenu Extension ****/
  $('body').on('click', '.dropdown-submenu > button:first-child', function(event){
    //preserve new intended state of related submenu
    var bNewState = !$(this).next('ul').hasClass('show');
    //*** close all sibling and descendant submenus ****/
    $(this).closest('.dropdown-submenu').closest('.dropdown-menu').find('.dropdown-submenu > .dropdown-menu.show').removeClass('show');
    /*** toggle this one ****/
    $(this).next('ul').toggleClass('show', bNewState);
    event.stopPropagation();
    event.preventDefault();
  });
  $('body').on('hide.bs.dropdown', '.dropdown', function(event){
    /* hide all submenus of dropdown when dropdoiwn is closed */
    $(this).find('.dropdown-submenu > .dropdown-menu.show').removeClass('show');
  })


  $('body').on('hidden.bs.toast', '.toast', function(event){
    var elem = this;
    elem.parentNode.removeChild(elem);
  });


  $('body').on('hide.bs.dropdown', '.card-menu', function(event){
    var cardKey = $(this).closest("[card]").attr("card");
    var card = _app.game.getCard(cardKey);
    card.selected = false;
    card.refreshUI(true);
  });

  $('body').on('show.bs.dropdown', '.card-menu', function(event){
    var $button = $(event.relatedTarget) // Button that triggered the dropdown
    var $menu = $(this).find(".dropdown-menu");
    var stackKey = $button.closest(".stack[stack]").attr("stack");
    var cardKey = $button.closest("[card]").attr("card");
    var stack = _app.game.getStack(stackKey);
    //toggle this card to selected and other cards to not selected
    stack.cards.forEach(function (v) {
      var card = _app.game.getCard(v);
      card.selected = (card.key == cardKey);
    });
    //refreshes stack html if stack has changed or just card face and selection for changed cards
    stack.refreshUI();
    //get the list of available card actions based on user and game context and the action's filter
    var actions = stack.cardActions.filter((v) => stack.check(v.filter) );
    //generate new html for menu options and replace current menu html
    _app.applyTemplate("actionlist", actions, $menu);
  })


});
