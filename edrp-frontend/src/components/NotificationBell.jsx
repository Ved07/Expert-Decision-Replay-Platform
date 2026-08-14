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
      <button
        className={`notification-bell__trigger ${open ? "notification-bell__trigger--active" : ""}`}
        onClick={handleOpen}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown animate-fade-in" role="region" aria-label="Notifications panel">
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
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(note)}
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