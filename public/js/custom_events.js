/*** Client-side code ****/
$(function () {
  //$('body').on('eventName', function(event, p1, p2){
  //to call use $('body').trigger('eventName', [p1, p2])

  //*** USER Events ****/
  $('body').on('initUser', function(event, pUserData){
  });

  $('body').on('login', function(event, pUserData){
  });

  $('body').on('logout', function(event, pOptions){
  });

  $('body').on('chatMessage', function(event, pMessage){
  });

  $('body').on('updateProfile', function(event, pProfileData){
  });


  //*** ROOM Events ****/
  $('body').on('addUser', function(event, pData){
  });

  $('body').on('blockUser', function(event, pData){
  });

  $('body').on('destroyRoom', function(event, pData){
  });

  $('body').on('hostRoom', function(event, pRoom){
  });

  $('body').on('quickPlay', function(event, pGameType){
  });

  $('body').on('joinRoom', function(event, pAccessCode){
  });

  $('body').on('leaveRoom', function(event, pRoom){
  });

  $('body').on('removeUser', function(event, pData){
  });

  $('body').on('updateRoom', function(event, pData){
  });

  $('body').on('unblockUser', function(event, pData){
  });

  $('body').on('updateUser', function(event, pData){
  });


  //*** GAME Events ****/
  $('body').on('addPlayer', function(event, pData){
  });

  $('body').on('changeGame', function(event, pGameType){
  });

  $('body').on('initGame', function(event, pGameType){
  });

  $('body').on('newHand', function(event, pOptions){
  });

  $('body').on('removePlayer', function(event, pData){
  });

  $('body').on('updateCard', function(event, pData){
  });

  $('body').on('updateGame', function(event, pData){
  });

  $('body').on('updatePlayer', function(event, pData){
  });

  $('body').on('updateStack', function(event, pData){
  });

});
