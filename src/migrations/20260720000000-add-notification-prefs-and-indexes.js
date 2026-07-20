"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add notificationPrefs JSON column to users table
    await queryInterface.addColumn("users", "notification_prefs", {
      type: Sequelize.JSON,
      allowNull: true,
    });

    // 2. Add reply and replyCreatedAt columns to reviews table
    await queryInterface.addColumn("reviews", "reply", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("reviews", "reply_created_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 3. Add database indexes to bookings table
    await queryInterface.addIndex("bookings", ["resident_id"], {
      name: "bookings_resident_id_idx",
    });
    await queryInterface.addIndex("bookings", ["vendor_id", "status"], {
      name: "bookings_vendor_id_status_idx",
    });

    // 4. Add index to reviews table
    await queryInterface.addIndex("reviews", ["vendor_id"], {
      name: "reviews_vendor_id_idx",
    });

    // 5. Add composite index to vendors table
    await queryInterface.addIndex("vendors", ["category", "lat", "lng"], {
      name: "vendors_category_lat_lng_idx",
    });

    // 6. Add index to chat_messages table
    await queryInterface.addIndex("chat_messages", ["sender_id", "recipient_id"], {
      name: "chat_messages_sender_recipient_idx",
    });
  },

  async down(queryInterface) {
    // Revert all additions
    await queryInterface.removeColumn("users", "notification_prefs");
    await queryInterface.removeColumn("reviews", "reply");
    await queryInterface.removeColumn("reviews", "reply_created_at");

    await queryInterface.removeIndex("bookings", "bookings_resident_id_idx");
    await queryInterface.removeIndex("bookings", "bookings_vendor_id_status_idx");
    await queryInterface.removeIndex("reviews", "reviews_vendor_id_idx");
    await queryInterface.removeIndex("vendors", "vendors_category_lat_lng_idx");
    await queryInterface.removeIndex("chat_messages", "chat_messages_sender_recipient_idx");
  },
};
