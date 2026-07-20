export function serializeVendor(
  vendor: any,
  options: { distance?: number; phone?: string | null } = {}
) {
  return {
    id: vendor.id,
    userId: vendor.userId,
    category: vendor.category,
    businessName: vendor.businessName,
    description: vendor.description,
    lat: vendor.lat,
    lng: vendor.lng,
    serviceRadiusM: vendor.serviceRadiusM,
    priceInfo: vendor.priceInfo,
    workingHours: vendor.workingHours,
    verificationTier: vendor.verificationTier,
    idDocumentUrl: vendor.idDocumentUrl || null,
    ratingAvg: vendor.ratingAvg,
    ratingCount: vendor.ratingCount,
    responseTimeMin: vendor.responseTimeMin,
    phone: options.phone !== undefined ? options.phone : (vendor.user?.phone || null),
    distance: options.distance,
    createdAt: vendor.createdAt.toISOString ? vendor.createdAt.toISOString() : String(vendor.createdAt),
  };
}

export function serializeBooking(booking: any) {
  return {
    id: booking.id,
    residentId: booking.residentId,
    vendorId: booking.vendorId,
    slotStart: booking.slotStart instanceof Date ? booking.slotStart.toISOString() : String(booking.slotStart),
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : String(booking.createdAt),
    updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : String(booking.updatedAt),
  };
}

export function serializeReview(review: any) {
  return {
    id: review.id,
    vendorId: review.vendorId,
    userId: review.userId,
    rating: review.rating,
    comment: review.comment,
    reply: review.reply,
    replyCreatedAt: review.replyCreatedAt
      ? (review.replyCreatedAt instanceof Date ? review.replyCreatedAt.toISOString() : String(review.replyCreatedAt))
      : null,
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : String(review.createdAt),
    userName: review.user?.name || "Anonymous",
  };
}
