$(document).ready(() => {
  $('.page-createRoom .create').click(async () => {
    if ($('.game-time').val()) {
      if (parseInt($('.game-time').val()) <= 0) {
        alert("时长必须是正数。");
        return;
      }
      var response = await fetch("/api/room/create", {
        "headers": { "content-type": "application/json" },
        "body": JSON.stringify({ length: parseInt($('.game-time').val()) }),
        "method": "POST",
      });
      var { roomId } = await response.json();
      window.location.pathname = `/room/${roomId}`;
    }
  });
});
