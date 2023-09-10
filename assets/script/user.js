$(document).ready(() => {
  $('.page-userLogin .login').click(async () => {
    if (!$('.username').val() || !$('.password')) return;
    var response = await fetch("/api/user/login", {
      "headers": { "content-type": "application/json" },
      "body": JSON.stringify({
        username: $('.username').val(),
        password: $('.password').val(),
      }),
      "method": "POST",
    });
    var result = await response.json();
    if (result.error) window.alert(result.error);
    else window.location.pathname = '/';
  });

  $('.page-userRegister .register').click(async () => {
    if (!$('.username').val() || !$('.password').val()) return;
    if ($('.password').val() != $('.repeat').val())
      return window.alert('两次输入的密码不一致。');
    var response = await fetch("/api/user/register", {
      "headers": { "content-type": "application/json" },
      "body": JSON.stringify({
        username: $('.username').val(),
        password: $('.password').val(),
      }),
      "method": "POST",
    });
    var result = await response.json();
    if (result.error) window.alert(result.error);
    else window.location.pathname = '/login';
  });
});
