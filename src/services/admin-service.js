const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');
const BROADCASTS_FILE = path.join(__dirname, '../../data/broadcasts.json');

function ensureDataFiles() {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    const initialUsers = [
      {
        id: 'usr-admin-01',
        name: 'Super Admin',
        email: 'admin@sanyuhub.com',
        role: 'admin',
        validationStatus: 'validated',
        isVerified: true,
        isSuspended: false,
        createdAt: '2025-01-01T00:00:00.000Z'
      },
      {
        id: 'usr-test-02',
        name: 'John Doe',
        email: 'johndoe@example.com',
        role: 'user',
        validationStatus: 'pending',
        isVerified: false,
        isSuspended: false,
        createdAt: '2025-02-15T12:00:00.000Z'
      },
      {
        id: 'usr-test-03',
        name: 'Grace Nakato',
        email: 'grace@example.com',
        role: 'subscriber',
        validationStatus: 'validated',
        isVerified: true,
        isSuspended: false,
        createdAt: '2025-02-18T14:30:00.000Z'
      },
      {
        id: 'usr-test-04',
        name: 'Ivan Kato',
        email: 'ivan@example.com',
        role: 'user',
        validationStatus: 'rejected',
        isVerified: false,
        isSuspended: false,
        createdAt: '2025-02-20T09:15:00.000Z'
      }
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf8');
  }

  if (!fs.existsSync(BROADCASTS_FILE)) {
    fs.writeFileSync(BROADCASTS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readUsers() {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading users file:', err);
    return [];
  }
}

function writeUsers(users) {
  ensureDataFiles();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function readBroadcasts() {
  ensureDataFiles();
  try {
    const raw = fs.readFileSync(BROADCASTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading broadcasts file:', err);
    return [];
  }
}

function writeBroadcasts(broadcasts) {
  ensureDataFiles();
  fs.writeFileSync(BROADCASTS_FILE, JSON.stringify(broadcasts, null, 2), 'utf8');
}

class AdminService {
  getAllUsers() {
    return readUsers();
  }

  getUserById(id) {
    const users = readUsers();
    return users.find(u => u.id === id) || null;
  }

  updateValidationStatus(userId, status) {
    const validStatuses = ['pending', 'validated', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`);
    }

    const users = readUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User not found: ${userId}`);
    }

    users[index].validationStatus = status;
    users[index].updatedAt = new Date().toISOString();
    writeUsers(users);
    return users[index];
  }

  setVerificationStatus(userId, isVerified) {
    const users = readUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User not found: ${userId}`);
    }

    users[index].isVerified = Boolean(isVerified);
    users[index].updatedAt = new Date().toISOString();
    writeUsers(users);
    return users[index];
  }

  deleteUser(userId) {
    const users = readUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User not found: ${userId}`);
    }

    const deleted = users.splice(index, 1)[0];
    writeUsers(users);
    return deleted;
  }

  promoteUser(userId, role) {
    const validRoles = ['user', 'subscriber', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of ${validRoles.join(', ')}`);
    }

    const users = readUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) {
      throw new Error(`User not found: ${userId}`);
    }

    users[index].role = role;
    users[index].updatedAt = new Date().toISOString();
    writeUsers(users);
    return users[index];
  }

  createBroadcast(broadcastData) {
    const { title, message, targetGroup, requestId } = broadcastData;
    if (!title || !message) {
      throw new Error('Title and message are required for broadcast');
    }

    const broadcasts = readBroadcasts();

    // Deduplication check
    if (requestId && broadcasts.some(b => b.requestId === requestId)) {
      const existing = broadcasts.find(b => b.requestId === requestId);
      return { broadcast: existing, duplicate: true };
    }

    const users = readUsers();
    let recipientCount = 0;
    const target = targetGroup || 'all';

    if (target === 'all') {
      recipientCount = users.length;
    } else if (target === 'active' || target === 'subscribers') {
      recipientCount = users.filter(u => u.role === 'subscriber' || u.role === 'admin').length;
    } else if (target === 'verified') {
      recipientCount = users.filter(u => u.isVerified).length;
    } else if (target === 'unverified') {
      recipientCount = users.filter(u => !u.isVerified).length;
    } else if (target === 'pending') {
      recipientCount = users.filter(u => u.validationStatus === 'pending').length;
    } else {
      recipientCount = users.length;
    }

    const record = {
      id: 'bc-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      requestId: requestId || null,
      title: title.trim(),
      message: message.trim(),
      targetGroup: target,
      recipientCount,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };

    broadcasts.unshift(record);
    writeBroadcasts(broadcasts);
    return { broadcast: record, duplicate: false };
  }

  getAllBroadcasts() {
    return readBroadcasts();
  }

  getUserNotifications(userId, userRole) {
    const broadcasts = readBroadcasts();
    return broadcasts.filter(b => {
      if (b.targetGroup === 'all') return true;
      if (b.targetGroup === 'active' || b.targetGroup === 'subscribers') {
        return userRole === 'subscriber' || userRole === 'admin';
      }
      return true;
    });
  }
}

module.exports = new AdminService();
