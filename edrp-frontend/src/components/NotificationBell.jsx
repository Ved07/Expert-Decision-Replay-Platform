import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
} from "../services/api";
import "./NotificationBell.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  async function loadUnreadCount() {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.unread_count);
    } catch (err) {
      // fail silently — a notification badge shouldn't break the whole page
    }
  }

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Close the dropdown if the user clicks anywhere outside it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open) {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (err) {
        // ignore
      }
    }
  }

  async function handleNotificationClick(note) {
    if (!note.is_read) {
      await markNotificationRead(note.id);
      loadUnreadCount();
    }
    setOpen(false);
    if (note.link) navigate(note.link);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    const data = await getNotifications();
    setNotifications(data);
    setUnreadCount(0);
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell__trigger" onClick={handleOpen}>
        🔔
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notification-dropdown__mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="notification-dropdown__empty">No notifications yet.</p>
          )}

          <div className="notification-dropdown__list">
            {notifications.map((note) => (
              <div
                key={note.id}
                className={`notification-item ${note.is_read ? "" : "notification-item--unread"}`}
                onClick={() => handleNotificationClick(note)}
              >
                <p className="notification-item__message">{note.message}</p>
                <span className="notification-item__date">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;