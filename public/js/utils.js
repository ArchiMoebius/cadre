function notifyUser(message) {

  if (!("Notification" in window)) {
    alert(message);
  } else if (Notification.permission === "granted") {
    new Notification(message);
  } else if (Notification.permission === "denied") {
    alert(message);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission(function(permission) {
      if (permission === "granted") {
        var notification = new Notification(message);
      }
    });
  }
}
