/**
 * @typedef {'user' | 'admin'} UserRole
 *
 * @typedef {Object} UserDocument
 * @property {import('mongoose').Types.ObjectId} _id
 * @property {string}   fullName
 * @property {string}   email
 * @property {string}   [password]          — undefined for Google-only accounts
 * @property {string}   [googleId]          — undefined for email/password accounts
 * @property {string}   [profileImageUrl]
 * @property {string}   [bio]
 * @property {UserRole} role
 * @property {boolean}  isEmailVerified
 * @property {boolean}  isActive
 * @property {string}   [refreshToken]      — hashed, stored for rotation validation
 * @property {Date}     [lastSeenAt]
 * @property {Date}     createdAt
 * @property {Date}     updatedAt
 *
 * @typedef {Omit<UserDocument, 'password' | 'refreshToken' | 'googleId'>} PublicUser
 * — Shape returned to clients; sensitive fields stripped
 *
 * @typedef {Object} UpdateProfilePayload
 * @property {string} [fullName]
 * @property {string} [bio]
 * @property {string} [profileImageUrl]
 *
 * @typedef {Object} ChangePasswordPayload
 * @property {string} currentPassword
 * @property {string} newPassword
 */
