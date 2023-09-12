$(document).ready(() => {
  $('.page-createRoom .create').click(async () => {
    if ($('.game-time').val()) {
      if (parseInt($('.game-time').val()) <= 0)
        return window.alert("时长必须是正数。");
      var response = await fetch("/api/room/create", {
        "headers": { "content-type": "application/json" },
        "body": JSON.stringify({ length: parseInt($('.game-time').val()) }),
        "method": "POST",
      });
      var { roomId, error } = await response.json();
      if (error) return window.alert(error);
      window.location.pathname = `/room/${roomId}`;
    }
  });

  $(".page-playInRoom .timeBoard-money").click(async () => {
    if (!window.isAdmin || window.status != ROOM_STATUS.WAITING) return;
    var countHunters = window.prompt('请输入添加的机器人操控的 Hunter 数目');
    if (!countHunters.length) return;
    var list = []; for (var i = 1; i <= 30; i++) list.push(String(i));
    if (!list.includes(countHunters)) countHunters = 5;
    var response = await fetch("/api/room/start", {
      "headers": { "content-type": "application/json" },
      "body": JSON.stringify({ roomId, hunter: Number(countHunters) }),
      "method": "POST",
    });
  });
});
