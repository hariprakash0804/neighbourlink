import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from "sequelize";
import sequelize from "@/lib/db";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const ROLES = ["RESIDENT", "VENDOR", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const VENDOR_CATEGORIES = [
  "NEWSPAPER", "CABLE_DTH", "MILK", "LPG_GAS", "WATER_CAN",
  "ELECTRICIAN", "PLUMBER", "CARPENTER", "AC_TECH", "MAID_COOK",
  "LAUNDRY", "TUTOR", "OTHER",
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VERIFICATION_TIERS = ["UNVERIFIED", "ID_VERIFIED", "TOP_RATED"] as const;
export type VerificationTier = (typeof VERIFICATION_TIERS)[number];

export const ESSENTIAL_CATEGORIES = [
  "HOSPITAL", "PHARMACY", "POLICE", "FIRE",
  "ENTERTAINMENT", "SCHOOL", "ATM", "BANK",
] as const;
export type EssentialCategory = (typeof ESSENTIAL_CATEGORIES)[number];

export const BOOKING_STATUSES = ["PENDING", "ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const REPORT_STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// ─── User ─────────────────────────────────────────────────────────────────────
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare phone: CreationOptional<string | null>;
  declare name: CreationOptional<string | null>;
  declare email: CreationOptional<string | null>;
  declare passwordHash: CreationOptional<string | null>;
  declare role: CreationOptional<Role>;
  declare notificationPrefs: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...ROLES),
      allowNull: false,
      defaultValue: "RESIDENT",
    },
    notificationPrefs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "User", tableName: "users" }
);

// ─── Address ──────────────────────────────────────────────────────────────────
export class Address extends Model<InferAttributes<Address>, InferCreationAttributes<Address>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare label: string;
  declare lat: number;
  declare lng: number;
  declare pincode: string;
  declare radiusMeters: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Address.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    radiusMeters: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1000,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "Address", tableName: "addresses" }
);

// ─── Vendor ───────────────────────────────────────────────────────────────────
export class Vendor extends Model<InferAttributes<Vendor>, InferCreationAttributes<Vendor>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare category: VendorCategory;
  declare businessName: string;
  declare description: CreationOptional<string | null>;
  declare lat: number;
  declare lng: number;
  declare serviceRadiusM: number;
  declare priceInfo: CreationOptional<object | null>;
  declare workingHours: CreationOptional<object | null>;
  declare verificationTier: CreationOptional<VerificationTier>;
  declare idDocumentUrl: CreationOptional<string | null>;
  declare ratingAvg: CreationOptional<number>;
  declare ratingCount: CreationOptional<number>;
  declare responseTimeMin: CreationOptional<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: User;
}

Vendor.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.ENUM(...VENDOR_CATEGORIES),
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    serviceRadiusM: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    priceInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    workingHours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    verificationTier: {
      type: DataTypes.ENUM(...VERIFICATION_TIERS),
      allowNull: false,
      defaultValue: "UNVERIFIED",
    },
    idDocumentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ratingAvg: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    ratingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    responseTimeMin: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Vendor",
    tableName: "vendors",
    indexes: [
      { fields: ["lat", "lng"] },
      { fields: ["user_id"] },
      { fields: ["category", "lat", "lng"] },
    ],
  }
);

// ─── Essential Service ────────────────────────────────────────────────────────
export class EssentialService extends Model<InferAttributes<EssentialService>, InferCreationAttributes<EssentialService>> {
  declare id: CreationOptional<string>;
  declare category: EssentialCategory;
  declare name: string;
  declare lat: number;
  declare lng: number;
  declare phone: CreationOptional<string | null>;
  declare is24x7: CreationOptional<boolean>;
  declare isGovtSource: CreationOptional<boolean>;
  declare metadata: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EssentialService.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    category: {
      type: DataTypes.ENUM(...ESSENTIAL_CATEGORIES),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    is24x7: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isGovtSource: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "EssentialService",
    tableName: "essential_services",
    indexes: [
      { fields: ["lat", "lng"] },
      { fields: ["category"] },
    ],
  }
);

// ─── Booking ──────────────────────────────────────────────────────────────────
export class Booking extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>> {
  declare id: CreationOptional<string>;
  declare residentId: string;
  declare vendorId: string;
  declare status: CreationOptional<BookingStatus>;
  declare slotStart: Date;
  declare notes: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare vendor?: Vendor;
  declare resident?: User;
}

Booking.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    residentId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    vendorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...BOOKING_STATUSES),
      allowNull: false,
      defaultValue: "PENDING",
    },
    slotStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
    indexes: [
      { fields: ["resident_id"] },
      { fields: ["vendor_id", "status"] },
    ],
  }
);

// ─── Review ───────────────────────────────────────────────────────────────────
export class Review extends Model<InferAttributes<Review>, InferCreationAttributes<Review>> {
  declare id: CreationOptional<string>;
  declare vendorId: string;
  declare userId: string;
  declare rating: number;
  declare comment: CreationOptional<string | null>;
  declare reply: CreationOptional<string | null>;
  declare replyCreatedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: User;
  declare vendor?: Vendor;
}

Review.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    vendorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    replyCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
    indexes: [
      { fields: ["vendor_id"] },
    ],
  }
);

// ─── Report ───────────────────────────────────────────────────────────────────
export class Report extends Model<InferAttributes<Report>, InferCreationAttributes<Report>> {
  declare id: CreationOptional<string>;
  declare reporterId: string;
  declare targetType: string;
  declare targetId: string;
  declare reason: string;
  declare status: CreationOptional<ReportStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare reporter?: User;
}

Report.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    reporterId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: "VENDOR | USER | REVIEW",
    },
    targetId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...REPORT_STATUSES),
      allowNull: false,
      defaultValue: "OPEN",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "Report", tableName: "reports" }
);

// ─── Civic Report ─────────────────────────────────────────────────────────────
export class CivicReport extends Model<InferAttributes<CivicReport>, InferCreationAttributes<CivicReport>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare lat: number;
  declare lng: number;
  declare category: string;
  declare description: CreationOptional<string | null>;
  declare photoUrl: CreationOptional<string | null>;
  declare status: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare reporter?: User;
}

CivicReport.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: "pothole, garbage, streetlight, etc.",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "OPEN",
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "CivicReport",
    tableName: "civic_reports",
    indexes: [
      { fields: ["lat", "lng"] },
    ],
  }
);

// ─── Audit Log ────────────────────────────────────────────────────────────────
export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<string>;
  declare actorId: string;
  declare action: string;
  declare targetId: CreationOptional<string | null>;
  declare metadata: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    actorId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    targetId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "AuditLog", tableName: "audit_logs" }
);

// ─── ChatMessage ──────────────────────────────────────────────────────────────
export class ChatMessage extends Model<InferAttributes<ChatMessage>, InferCreationAttributes<ChatMessage>> {
  declare id: CreationOptional<string>;
  declare senderId: string;
  declare recipientId: string;
  declare content: string;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare sender?: User;
  declare recipient?: User;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    senderId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    recipientId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "ChatMessage",
    tableName: "chat_messages",
    indexes: [
      { fields: ["sender_id", "recipient_id"] },
    ],
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
Address.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasOne(Vendor, { foreignKey: "userId", as: "vendor" });
Vendor.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Report, { foreignKey: "reporterId", as: "reports" });
Report.belongsTo(User, { foreignKey: "reporterId", as: "reporter" });

Vendor.hasMany(Booking, { foreignKey: "vendorId", as: "bookings" });
Booking.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

User.hasMany(Booking, { foreignKey: "residentId", as: "residentBookings" });
Booking.belongsTo(User, { foreignKey: "residentId", as: "resident" });

Vendor.hasMany(Review, { foreignKey: "vendorId", as: "reviews" });
Review.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

User.hasMany(ChatMessage, { foreignKey: "senderId", as: "sentMessages" });
User.hasMany(ChatMessage, { foreignKey: "recipientId", as: "receivedMessages" });
ChatMessage.belongsTo(User, { foreignKey: "senderId", as: "sender" });
ChatMessage.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

// ─── Bulletin Post ────────────────────────────────────────────────────────────
export const BULLETIN_CATEGORIES = ["ANNOUNCEMENT", "LOST_FOUND", "GARAGE_SALE", "GENERAL"] as const;
export type BulletinCategory = (typeof BULLETIN_CATEGORIES)[number];

export class BulletinPost extends Model<InferAttributes<BulletinPost>, InferCreationAttributes<BulletinPost>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare category: BulletinCategory;
  declare title: string;
  declare content: string;
  declare photoUrl: CreationOptional<string | null>;
  declare lat: CreationOptional<number | null>;
  declare lng: CreationOptional<number | null>;
  declare expiresAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare author?: User;
}

BulletinPost.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    category: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "GENERAL" },
    title: { type: DataTypes.STRING(255), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    photoUrl: { type: DataTypes.TEXT, allowNull: true },
    lat: { type: DataTypes.DOUBLE, allowNull: true },
    lng: { type: DataTypes.DOUBLE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "BulletinPost", tableName: "bulletin_posts" }
);

User.hasMany(BulletinPost, { foreignKey: "userId", as: "bulletinPosts" });
BulletinPost.belongsTo(User, { foreignKey: "userId", as: "author" });

// ─── Local Event ──────────────────────────────────────────────────────────────
export const EVENT_CATEGORIES = ["FESTIVAL", "MEETING", "NOTICE", "OTHER"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export class LocalEvent extends Model<InferAttributes<LocalEvent>, InferCreationAttributes<LocalEvent>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: string;
  declare description: string;
  declare venue: string;
  declare lat: CreationOptional<number | null>;
  declare lng: CreationOptional<number | null>;
  declare startDate: Date;
  declare endDate: CreationOptional<Date | null>;
  declare category: EventCategory;
  declare photoUrl: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare author?: User;
}

LocalEvent.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    venue: { type: DataTypes.STRING(255), allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: true },
    lng: { type: DataTypes.DOUBLE, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: true },
    category: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "OTHER" },
    photoUrl: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "LocalEvent", tableName: "local_events" }
);

User.hasMany(LocalEvent, { foreignKey: "userId", as: "localEvents" });
LocalEvent.belongsTo(User, { foreignKey: "userId", as: "author" });

// ─── SOS Alert ────────────────────────────────────────────────────────────────
export class SosAlert extends Model<InferAttributes<SosAlert>, InferCreationAttributes<SosAlert>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare lat: number;
  declare lng: number;
  declare message: CreationOptional<string | null>;
  declare contactsNotified: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare user?: User;
}

SosAlert.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    lat: { type: DataTypes.DOUBLE, allowNull: false },
    lng: { type: DataTypes.DOUBLE, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    contactsNotified: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, modelName: "SosAlert", tableName: "sos_alerts" }
);

User.hasMany(SosAlert, { foreignKey: "userId", as: "sosAlerts" });
SosAlert.belongsTo(User, { foreignKey: "userId", as: "user" });

// Add CivicReport associations
User.hasMany(CivicReport, { foreignKey: "userId", as: "civicReports" });
CivicReport.belongsTo(User, { foreignKey: "userId", as: "reporter" });

// ─── Favorite ─────────────────────────────────────────────────────────────────
export class Favorite extends Model<InferAttributes<Favorite>, InferCreationAttributes<Favorite>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare vendorId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare vendor?: Vendor;
  declare user?: User;
}

Favorite.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    vendorId: { type: DataTypes.STRING(50), allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Favorite",
    tableName: "favorites",
    indexes: [
      { unique: true, fields: ["user_id", "vendor_id"] },
    ],
  }
);

User.hasMany(Favorite, { foreignKey: "userId", as: "favorites" });
Favorite.belongsTo(User, { foreignKey: "userId", as: "user" });
Vendor.hasMany(Favorite, { foreignKey: "vendorId", as: "favorites" });
Favorite.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

// ─── Notification ─────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = ["BOOKING_UPDATE", "NEW_REVIEW", "NEW_MESSAGE", "SYSTEM", "VENDOR_VERIFIED"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string;
  declare read: CreationOptional<boolean>;
  declare metadata: CreationOptional<object | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Notification.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    type: { type: DataTypes.STRING(30), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    metadata: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    indexes: [
      { fields: ["user_id", "read"] },
      { fields: ["created_at"] },
    ],
  }
);

User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// ─── Deal / Discount Offer ────────────────────────────────────────────────────
export class Deal extends Model<InferAttributes<Deal>, InferCreationAttributes<Deal>> {
  declare id: CreationOptional<string>;
  declare vendorId: string;
  declare title: string;
  declare description: string;
  declare discountPercent: number;
  declare validUntil: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare vendor?: Vendor;
}

Deal.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    vendorId: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    discountPercent: { type: DataTypes.INTEGER, allowNull: false },
    validUntil: { type: DataTypes.DATE, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Deal",
    tableName: "deals",
    indexes: [{ fields: ["vendor_id"] }, { fields: ["valid_until"] }],
  }
);

Vendor.hasMany(Deal, { foreignKey: "vendorId", as: "deals" });
Deal.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });

// ─── Carpool ──────────────────────────────────────────────────────────────────
export class Carpool extends Model<InferAttributes<Carpool>, InferCreationAttributes<Carpool>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare origin: string;
  declare destination: string;
  declare departureTime: Date;
  declare seatsAvailable: number;
  declare pricePerSeat: CreationOptional<number>;
  declare lat: number;
  declare lng: number;
  declare notes: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare driver?: User;
}

Carpool.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    origin: { type: DataTypes.STRING(255), allowNull: false },
    destination: { type: DataTypes.STRING(255), allowNull: false },
    departureTime: { type: DataTypes.DATE, allowNull: false },
    seatsAvailable: { type: DataTypes.INTEGER, allowNull: false },
    pricePerSeat: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lng: { type: DataTypes.FLOAT, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Carpool",
    tableName: "carpools",
    indexes: [{ fields: ["lat", "lng"] }, { fields: ["user_id"] }],
  }
);

// ─── Job Post ─────────────────────────────────────────────────────────────────
export const JOB_CATEGORIES = ["CLEANING", "GARDENING", "DELIVERY", "TUTORING", "PET_CARE", "BABYSITTING", "OTHER"] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export class JobPost extends Model<InferAttributes<JobPost>, InferCreationAttributes<JobPost>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare title: string;
  declare description: string;
  declare category: JobCategory;
  declare compensation: number;
  declare lat: number;
  declare lng: number;
  declare phone: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  // Associations
  declare poster?: User;
}

JobPost.init(
  {
    id: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.ENUM(...JOB_CATEGORIES), allowNull: false },
    compensation: { type: DataTypes.INTEGER, allowNull: false },
    lat: { type: DataTypes.FLOAT, allowNull: false },
    lng: { type: DataTypes.FLOAT, allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "JobPost",
    tableName: "job_posts",
    indexes: [{ fields: ["lat", "lng"] }, { fields: ["user_id"] }],
  }
);

// Associations
User.hasMany(Carpool, { foreignKey: "userId", as: "carpools" });
Carpool.belongsTo(User, { foreignKey: "userId", as: "driver" });

User.hasMany(JobPost, { foreignKey: "userId", as: "jobPosts" });
JobPost.belongsTo(User, { foreignKey: "userId", as: "poster" });

// ─── Sync helper (dev only) ──────────────────────────────────────────────────
export async function syncDatabase(force = false) {
  await sequelize.sync({ force, alter: !force });
  console.log("✅ Database synced successfully");
}

export { sequelize };

