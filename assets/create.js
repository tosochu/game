$(document).ready(() => {
  $('.submitButton').click(() => {
    if ($('.gameTimeInput').val()) {
      if (parseInt($('.gameTimeInput').val()) <= 0) {
        alert("时长必须是正数。");
        return;
      }
      $.post("/api/create",
        { length: parseInt($('.gameTimeInput').val()) },
        (data, status) => {
          window.location.pathname = `/room/${data.roomId}`;
        }
      );
    }
  });
});
