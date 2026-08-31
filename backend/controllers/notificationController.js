const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
    const { unreadOnly, limit = 20 } = req.query;
    const filter = { user: req.user.id };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10) || 20);

    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });

    res.json({ notifications, unreadCount });
};

const markRead = async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { read: true },
        { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read', notification });
};

const markAllRead = async (req, res) => {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
};

const deleteNotification = async (req, res) => {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
