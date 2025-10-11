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
    if (!window.isAdmin || window.room_status != ROOM_STATUS.WAITING) return;
    var countHunters = window.prompt('请输入添加的机器人操控的 Hunter 数目（整数，0 ~ 10，若未设置人类 Hunter 那么不能取 0，如果不合法自动设置为默认数量 5）');
    if (!countHunters.length) return;
    var list = []; for (var i = 1; i <= 30; i++) list.push(String(i));
    if (markAsHunter.length > 0) list.push('0');
    if (!list.includes(countHunters)) countHunters = 5;
    await fetch("/api/room/start", {
      "headers": { "content-type": "application/json" },
      "body": JSON.stringify({ roomId, hunter: Number(countHunters), markAsHunter: window.markAsHunter }),
      "method": "POST",
    });
  });

  window.handleClickPlayer = async player => {
    console.info('click', player)
    if (window.isWatching) {
      await fetch("/api/room/updateWatch", {
        "headers": { "content-type": "application/json" },
        "body": JSON.stringify({ roomId, watch: player }),
        "method": "POST",
      });
      return;
    }
    if (!window.isAdmin || window.room_status != ROOM_STATUS.WAITING) return;
    if (markAsHunter.includes(player)) markAsHunter = markAsHunter.filter(x => x != player);
    else markAsHunter.push(player);
  };

  // Add: load and render room list on the create page
  async function loadRoomList() {
    const container = $('.page-createRoom .room-list');
    if (!container.length) return;
    container.text('加载中...');
    try {
      const response = await fetch('/api/room/list');
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        container.text('暂无房间。');
        return;
      }
      function statusText(s) {
        return {
          1: '等待开始',
          2: '进行中',
          3: '已结束',
        }[s]
      }
      const ul = $('<ul/>');
      data.forEach(r => {
        const li = $(`<li class="room-entry" data-room="${r.roomId}">房间 ${r.roomId}：${r.cnt.fugitive} 人 — ${r.cnt.hunter ? r.cnt.hunter : '未设置'} 鬼 — ${r.length} 分钟 — ${statusText(r.status)} — 由 ${r.admin} 创建</li>`);
        ul.append(li);
      });
      container.empty().append(ul);
    } catch (e) {
      container.text('加载失败。');
    }
  }

  // navigate to a room when clicking a list item (delegated)
  $(document).on('click', '.page-createRoom .room-list .room-entry', function () {
    const rid = $(this).data('room');
    if (rid) window.location.pathname = `/room/${rid}`;
  });

  // initial load and provide a simple refresh button if present
  loadRoomList();
  $('.page-createRoom .room-list-refresh').click(loadRoomList);
});
