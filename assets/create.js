$(document).ready(() => {
  $('.submitButton').click(() => {
    if ($('.gameTimeInput').val()) {
      try {
        console.log(234123)
        $.post("/api/create",
          { length: parseInt($('.gameTimeInput').val()) },
          (data, status) => {
            window.location.pathname = `/room/${data.roomId}`;
          }
        );
      }
      catch (e) { console.error(e) };
    }
  });
});
