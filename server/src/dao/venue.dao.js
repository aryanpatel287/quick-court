import { db } from '../config/database.config.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { sports } from '../db/schema/sports.schema.js';
import { facilitySports } from '../db/schema/facility_sports.schema.js';
import { amenities } from '../db/schema/amenities.schema.js';
import { facilityAmenities } from '../db/schema/facility_amenities.schema.js';
import { facilityPhotos } from '../db/schema/facility_photos.schema.js';
import { reviews } from '../db/schema/reviews.schema.js';
import { users } from '../db/schema/users.schema.js';
import { courtOperatingHours } from '../db/schema/court_operating_hours.schema.js';
import { maintenanceBlocks } from '../db/schema/maintenance_blocks.schema.js';
import { bookings } from '../db/schema/bookings.schema.js';
import { eq, and, isNull, sql, ilike, or, desc, asc, inArray, lt, gt } from 'drizzle-orm';
import { formatDateToDDMMYYYY } from '../utils/date.utils.js';

/**
 * List approved venues with filters, search, aggregation, and pagination
 *
 * @param {object} params
 * @param {string} [params.search]
 * @param {string} [params.city]
 * @param {string} [params.sport] - Sport name, slug, or UUID
 * @param {string} [params.venueType] - UPPERCASE enum
 * @param {number} [params.minPrice]
 * @param {number} [params.maxPrice]
 * @param {number} [params.minRating]
 * @param {number} [params.page=1]
 * @param {number} [params.limit=12]
 * @param {string} [params.sortBy='newest'] - 'price_asc' | 'price_desc' | 'rating_desc' | 'newest'
 */
export async function listVenues({
    search,
    city,
    sport,
    venueType,
    minPrice,
    maxPrice,
    minRating,
    page = 1,
    limit = 12,
    sortBy = 'newest',
} = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    // Base WHERE conditions: PUBLIC GATE IS MANDATORY
    const whereConditions = [eq(facilities.status, 'APPROVED'), isNull(facilities.deletedAt)];

    if (city && typeof city === 'string' && city.trim()) {
        whereConditions.push(ilike(facilities.city, `%${city.trim()}%`));
    }

    if (venueType && typeof venueType === 'string' && venueType.trim()) {
        whereConditions.push(eq(facilities.venueType, venueType.trim().toUpperCase()));
    }

    if (search && typeof search === 'string' && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push(
            or(
                ilike(facilities.name, searchTerm),
                ilike(facilities.city, searchTerm),
                ilike(facilities.addressLine, searchTerm),
                ilike(facilities.description, searchTerm),
            ),
        );
    }

    if (sport && typeof sport === 'string' && sport.trim()) {
        const sportTerm = sport.trim();
        const matchingFacilityIdsQuery = db
            .select({ facilityId: facilitySports.facilityId })
            .from(facilitySports)
            .innerJoin(sports, eq(facilitySports.sportId, sports.id))
            .where(
                or(
                    eq(
                        sports.id,
                        sportTerm.match(/^[0-9a-fA-F-]{36}$/)
                            ? sportTerm
                            : '00000000-0000-0000-0000-000000000000',
                    ),
                    ilike(sports.slug, sportTerm),
                    ilike(sports.name, `%${sportTerm}%`),
                ),
            );
        whereConditions.push(inArray(facilities.id, matchingFacilityIdsQuery));
    }

    // Subquery for starting price (min court price)
    const courtPriceSq = sql`(
        SELECT MIN(c.price_amount)
        FROM ${courts} c
        WHERE c.facility_id = ${facilities.id} AND c.is_active = true
    )`;

    // Subquery for average rating
    const avgRatingSq = sql`COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM ${reviews} r
        WHERE r.facility_id = ${facilities.id}
    ), 0)`;

    // Subquery for review count
    const reviewCountSq = sql`COALESCE((
        SELECT COUNT(r.id)::int
        FROM ${reviews} r
        WHERE r.facility_id = ${facilities.id}
    ), 0)`;

    // Subquery for primary photo
    const primaryPhotoSq = sql`(
        SELECT fp.image_url
        FROM ${facilityPhotos} fp
        WHERE fp.facility_id = ${facilities.id}
        ORDER BY fp.is_primary DESC, fp.display_order ASC, fp.created_at ASC
        LIMIT 1
    )`;

    // Subquery for sports array
    const sportsSq = sql`COALESCE((
        SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'slug', s.slug))
        FROM ${facilitySports} fs
        INNER JOIN ${sports} s ON s.id = fs.sport_id
        WHERE fs.facility_id = ${facilities.id} AND s.is_active = true
    ), '[]'::json)`;

    // Apply minPrice, maxPrice, minRating filters if provided
    if (minPrice !== undefined && minPrice !== null && !isNaN(minPrice)) {
        whereConditions.push(sql`${courtPriceSq} >= ${Number(minPrice)}`);
    }

    if (maxPrice !== undefined && maxPrice !== null && !isNaN(maxPrice)) {
        whereConditions.push(sql`${courtPriceSq} <= ${Number(maxPrice)}`);
    }

    if (minRating !== undefined && minRating !== null && !isNaN(minRating)) {
        whereConditions.push(sql`${avgRatingSq} >= ${Number(minRating)}`);
    }

    const combinedWhere = and(...whereConditions);

    // Total count query
    const [{ totalCount }] = await db
        .select({
            totalCount: sql`COUNT(*)::int`,
        })
        .from(facilities)
        .where(combinedWhere);

    // Sorting definition
    let orderByClause;
    switch (sortBy) {
        case 'price_asc':
            orderByClause = [asc(courtPriceSq), desc(facilities.createdAt)];
            break;
        case 'price_desc':
            orderByClause = [desc(courtPriceSq), desc(facilities.createdAt)];
            break;
        case 'rating_desc':
            orderByClause = [desc(avgRatingSq), desc(reviewCountSq)];
            break;
        case 'newest':
        default:
            orderByClause = [desc(facilities.createdAt)];
            break;
    }

    // Query paginated venues
    const rows = await db
        .select({
            id: facilities.id,
            name: facilities.name,
            description: facilities.description,
            addressLine: facilities.addressLine,
            city: facilities.city,
            state: facilities.state,
            postalCode: facilities.postalCode,
            latitude: facilities.latitude,
            longitude: facilities.longitude,
            venueType: facilities.venueType,
            createdAt: facilities.createdAt,
            primaryPhoto: primaryPhotoSq,
            sports: sportsSq,
            startingPrice: courtPriceSq,
            currency: sql`'INR'`,
            averageRating: avgRatingSq,
            reviewCount: reviewCountSq,
        })
        .from(facilities)
        .where(combinedWhere)
        .orderBy(...orderByClause)
        .limit(limitNum)
        .offset(offset);

    const formattedVenues = rows.map((v) => ({
        id: v.id,
        name: v.name,
        description: v.description,
        addressLine: v.addressLine,
        city: v.city,
        state: v.state,
        postalCode: v.postalCode,
        latitude: v.latitude ? parseFloat(v.latitude) : null,
        longitude: v.longitude ? parseFloat(v.longitude) : null,
        venueType: v.venueType,
        primaryPhoto: v.primaryPhoto || null,
        sports: Array.isArray(v.sports) ? v.sports : [],
        startingPrice: v.startingPrice !== null ? parseFloat(v.startingPrice) : null,
        currency: 'INR',
        averageRating: v.averageRating !== null ? parseFloat(v.averageRating) : 0,
        reviewCount: parseInt(v.reviewCount, 10) || 0,
        createdAt: v.createdAt,
    }));

    const total = parseInt(totalCount, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
        venues: formattedVenues,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
        },
    };
}

/**
 * Get approved venue details by ID
 * Note: Never returns ownerId or rejectionReason.
 *
 * @param {string} venueId
 * @returns {Promise<object|null>}
 */
export async function getVenueById(venueId) {
    const [facility] = await db
        .select({
            id: facilities.id,
            name: facilities.name,
            description: facilities.description,
            addressLine: facilities.addressLine,
            city: facilities.city,
            state: facilities.state,
            postalCode: facilities.postalCode,
            latitude: facilities.latitude,
            longitude: facilities.longitude,
            venueType: facilities.venueType,
            createdAt: facilities.createdAt,
            updatedAt: facilities.updatedAt,
        })
        .from(facilities)
        .where(
            and(
                eq(facilities.id, venueId),
                eq(facilities.status, 'APPROVED'),
                isNull(facilities.deletedAt),
            ),
        );

    if (!facility) {
        return null;
    }

    // Fetch photos
    const photos = await db
        .select({
            id: facilityPhotos.id,
            imageUrl: facilityPhotos.imageUrl,
            isPrimary: facilityPhotos.isPrimary,
            displayOrder: facilityPhotos.displayOrder,
        })
        .from(facilityPhotos)
        .where(eq(facilityPhotos.facilityId, venueId))
        .orderBy(
            desc(facilityPhotos.isPrimary),
            asc(facilityPhotos.displayOrder),
            asc(facilityPhotos.createdAt),
        );

    // Fetch sports
    const facilitySportsList = await db
        .select({
            id: sports.id,
            name: sports.name,
            slug: sports.slug,
        })
        .from(facilitySports)
        .innerJoin(sports, eq(facilitySports.sportId, sports.id))
        .where(and(eq(facilitySports.facilityId, venueId), eq(sports.isActive, true)));

    // Fetch amenities
    const facilityAmenitiesList = await db
        .select({
            id: amenities.id,
            name: amenities.name,
        })
        .from(facilityAmenities)
        .innerJoin(amenities, eq(facilityAmenities.amenityId, amenities.id))
        .where(and(eq(facilityAmenities.facilityId, venueId), eq(amenities.isActive, true)));

    // Fetch courts summary
    const courtsList = await db
        .select({
            id: courts.id,
            name: courts.name,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            sportId: courts.sportId,
            sportName: sports.name,
            sportSlug: sports.slug,
        })
        .from(courts)
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .where(and(eq(courts.facilityId, venueId), eq(courts.isActive, true)))
        .orderBy(asc(courts.name));

    const prices = courtsList.map((c) => parseFloat(c.priceAmount)).filter((p) => !isNaN(p));
    const startingPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Fetch reviews statistics
    const [reviewStats] = await db
        .select({
            averageRating: sql`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 1), 0)`,
            totalReviews: sql`COUNT(${reviews.id})::int`,
        })
        .from(reviews)
        .where(eq(reviews.facilityId, venueId));

    // Fetch recent reviews (top 5)
    const recentReviewsList = await db
        .select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            user: {
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                profileImage: users.profileImage,
            },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.facilityId, venueId))
        .orderBy(desc(reviews.createdAt))
        .limit(5);

    return {
        ...facility,
        latitude: facility.latitude ? parseFloat(facility.latitude) : null,
        longitude: facility.longitude ? parseFloat(facility.longitude) : null,
        photos,
        primaryPhoto: photos.find((p) => p.isPrimary)?.imageUrl || photos[0]?.imageUrl || null,
        sports: facilitySportsList,
        amenities: facilityAmenitiesList,
        courts: courtsList.map((c) => ({
            id: c.id,
            name: c.name,
            sport: {
                id: c.sportId,
                name: c.sportName,
                slug: c.sportSlug,
            },
            priceAmount: parseFloat(c.priceAmount),
            priceCurrency: c.priceCurrency,
            isActive: c.isActive,
        })),
        priceRange: {
            min: startingPrice,
            max: maxPrice,
            currency: 'INR',
        },
        startingPrice,
        currency: 'INR',
        averageRating: reviewStats ? parseFloat(reviewStats.averageRating) : 0,
        reviewCount: reviewStats ? parseInt(reviewStats.totalReviews, 10) : 0,
        recentReviews: recentReviewsList,
    };
}

/**
 * Get active courts for an approved venue
 *
 * @param {string} venueId
 * @returns {Promise<Array<object>>}
 */
export async function getVenueCourts(venueId) {
    // Verify approved venue exists
    const [facility] = await db
        .select({ id: facilities.id })
        .from(facilities)
        .where(
            and(
                eq(facilities.id, venueId),
                eq(facilities.status, 'APPROVED'),
                isNull(facilities.deletedAt),
            ),
        );

    if (!facility) {
        return null;
    }

    const courtRows = await db
        .select({
            id: courts.id,
            name: courts.name,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            sportId: courts.sportId,
            sportName: sports.name,
            sportSlug: sports.slug,
        })
        .from(courts)
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .where(and(eq(courts.facilityId, venueId), eq(courts.isActive, true)))
        .orderBy(asc(courts.name));

    return courtRows.map((c) => ({
        id: c.id,
        name: c.name,
        sport: {
            id: c.sportId,
            name: c.sportName,
            slug: c.sportSlug,
        },
        priceAmount: parseFloat(c.priceAmount),
        priceCurrency: c.priceCurrency,
        isActive: c.isActive,
    }));
}

/**
 * Helper to parse time string "HH:MM:SS" or "HH:MM" to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map((p) => parseInt(p, 10));
    return parts[0] * 60 + (parts[1] || 0);
}

/**
 * Helper to format minutes from midnight to "HH:MM"
 * @param {number} totalMinutes
 * @returns {string}
 */
function minutesToTimeString(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get availability slots for a court on a given date
 *
 * @param {string} venueId
 * @param {string} courtId
 * @param {Date} targetDate
 * @param {number} [slotDurationMinutes=60]
 * @returns {Promise<object|null>}
 */
export async function getCourtAvailability(venueId, courtId, targetDate, slotDurationMinutes = 60) {
    // 1. Verify venue is APPROVED and not deleted
    const [facility] = await db
        .select({ id: facilities.id })
        .from(facilities)
        .where(
            and(
                eq(facilities.id, venueId),
                eq(facilities.status, 'APPROVED'),
                isNull(facilities.deletedAt),
            ),
        );

    if (!facility) {
        return null;
    }

    // 2. Verify court belongs to facility and is active
    const [court] = await db
        .select({
            id: courts.id,
            name: courts.name,
            facilityId: courts.facilityId,
            isActive: courts.isActive,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
        })
        .from(courts)
        .where(
            and(eq(courts.id, courtId), eq(courts.facilityId, venueId), eq(courts.isActive, true)),
        );

    if (!court) {
        return null;
    }

    // 3. Day of week (0 = Sunday, ..., 6 = Saturday)
    const dayOfWeek = targetDate.getDay();

    // 4. Operating hours for this court & day
    const [opHours] = await db
        .select()
        .from(courtOperatingHours)
        .where(
            and(
                eq(courtOperatingHours.courtId, courtId),
                eq(courtOperatingHours.dayOfWeek, dayOfWeek),
            ),
        );

    const dateFormatted = formatDateToDDMMYYYY(targetDate, '-');

    if (!opHours || opHours.isClosed || !opHours.startTime || !opHours.endTime) {
        return {
            venueId,
            courtId,
            courtName: court.name,
            date: dateFormatted,
            operatingHours: {
                startTime: opHours?.startTime ? opHours.startTime.substring(0, 5) : null,
                endTime: opHours?.endTime ? opHours.endTime.substring(0, 5) : null,
                isClosed: true,
            },
            priceAmount: parseFloat(court.priceAmount),
            priceCurrency: court.priceCurrency,
            slots: [],
        };
    }

    const startMinutes = timeToMinutes(opHours.startTime);
    const endMinutes = timeToMinutes(opHours.endTime);

    // 5. Define target day start and end timestamps (in UTC / local Date range)
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // 6. Fetch CONFIRMED bookings for this court overlapping the day
    const dayBookings = await db
        .select({
            id: bookings.id,
            startTime: bookings.startTime,
            endTime: bookings.endTime,
            status: bookings.status,
        })
        .from(bookings)
        .where(
            and(
                eq(bookings.courtId, courtId),
                eq(bookings.status, 'CONFIRMED'),
                lt(bookings.startTime, dayEnd),
                gt(bookings.endTime, dayStart),
            ),
        );

    // 7. Fetch maintenance blocks for this court overlapping the day
    const dayMaintenance = await db
        .select({
            id: maintenanceBlocks.id,
            startTime: maintenanceBlocks.startTime,
            endTime: maintenanceBlocks.endTime,
        })
        .from(maintenanceBlocks)
        .where(
            and(
                eq(maintenanceBlocks.courtId, courtId),
                lt(maintenanceBlocks.startTime, dayEnd),
                gt(maintenanceBlocks.endTime, dayStart),
            ),
        );

    // 8. Generate slots
    const slots = [];
    const now = new Date();
    const duration = Math.max(15, slotDurationMinutes);

    for (let current = startMinutes; current + duration <= endMinutes; current += duration) {
        const slotStartMin = current;
        const slotEndMin = current + duration;

        const slotStartTimeStr = minutesToTimeString(slotStartMin);
        const slotEndTimeStr = minutesToTimeString(slotEndMin);

        // Build exact timestamp objects for slot comparison
        const slotStartDate = new Date(targetDate);
        const [startH, startM] = slotStartTimeStr.split(':').map((n) => parseInt(n, 10));
        slotStartDate.setHours(startH, startM, 0, 0);

        const slotEndDate = new Date(targetDate);
        const [endH, endM] = slotEndTimeStr.split(':').map((n) => parseInt(n, 10));
        slotEndDate.setHours(endH, endM, 0, 0);

        let status = 'available';

        // Check if in the past
        if (slotEndDate.getTime() <= now.getTime()) {
            status = 'past';
        } else {
            // Check maintenance collision
            const hasMaintenance = dayMaintenance.some((mb) => {
                const mbStart = new Date(mb.startTime);
                const mbEnd = new Date(mb.endTime);
                return slotStartDate < mbEnd && slotEndDate > mbStart;
            });

            if (hasMaintenance) {
                status = 'maintenance_blocked';
            } else {
                // Check booking collision
                const hasBooking = dayBookings.some((bk) => {
                    const bkStart = new Date(bk.startTime);
                    const bkEnd = new Date(bk.endTime);
                    return slotStartDate < bkEnd && slotEndDate > bkStart;
                });

                if (hasBooking) {
                    status = 'booked';
                }
            }
        }

        slots.push({
            startTime: slotStartTimeStr,
            endTime: slotEndTimeStr,
            status,
        });
    }

    return {
        venueId,
        courtId,
        courtName: court.name,
        date: dateFormatted,
        operatingHours: {
            startTime: opHours.startTime.substring(0, 5),
            endTime: opHours.endTime.substring(0, 5),
            isClosed: false,
        },
        priceAmount: parseFloat(court.priceAmount),
        priceCurrency: court.priceCurrency,
        slots,
    };
}

/**
 * Get popular venues for home screen
 *
 * @param {object} params
 * @param {number} [params.limit=6]
 * @param {string} [params.city]
 * @returns {Promise<Array<object>>}
 */
export async function getPopularVenues({ limit = 6, city } = {}) {
    const limitNum = Math.max(1, Math.min(20, parseInt(limit, 10) || 6));
    const result = await listVenues({
        city,
        limit: limitNum,
        page: 1,
        sortBy: 'rating_desc',
    });
    return result.venues;
}

/**
 * Get popular sports with active facility count
 *
 * @param {object} params
 * @param {number} [params.limit=10]
 * @returns {Promise<Array<object>>}
 */
export async function getPopularSports({ limit = 10 } = {}) {
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

    const rows = await db
        .select({
            id: sports.id,
            name: sports.name,
            slug: sports.slug,
            facilityCount: sql`COUNT(DISTINCT ${facilities.id})::int`,
        })
        .from(sports)
        .innerJoin(facilitySports, eq(sports.id, facilitySports.sportId))
        .innerJoin(
            facilities,
            and(
                eq(facilitySports.facilityId, facilities.id),
                eq(facilities.status, 'APPROVED'),
                isNull(facilities.deletedAt),
            ),
        )
        .where(eq(sports.isActive, true))
        .groupBy(sports.id, sports.name, sports.slug)
        .orderBy(desc(sql`COUNT(DISTINCT ${facilities.id})`), asc(sports.name))
        .limit(limitNum);

    return rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        facilityCount: parseInt(r.facilityCount, 10) || 0,
    }));
}

/**
 * Get platform summary statistics for public home page
 *
 * @returns {Promise<object>}
 */
export async function getHomeStats() {
    const [venueStats] = await db
        .select({
            totalVenues: sql`COUNT(DISTINCT ${facilities.id})::int`,
            totalCities: sql`COUNT(DISTINCT ${facilities.city})::int`,
        })
        .from(facilities)
        .where(and(eq(facilities.status, 'APPROVED'), isNull(facilities.deletedAt)));

    const [sportStats] = await db
        .select({
            totalSports: sql`COUNT(DISTINCT ${sports.id})::int`,
        })
        .from(sports)
        .where(eq(sports.isActive, true));

    return {
        totalVenues: venueStats ? parseInt(venueStats.totalVenues, 10) : 0,
        totalCities: venueStats ? parseInt(venueStats.totalCities, 10) : 0,
        totalSports: sportStats ? parseInt(sportStats.totalSports, 10) : 0,
    };
}

/**
 * Get full aggregated home feed
 *
 * @param {object} [params]
 * @param {string} [params.city]
 * @returns {Promise<object>}
 */
export async function getHomeFeed({ city } = {}) {
    const [popularVenues, popularSports, stats] = await Promise.all([
        getPopularVenues({ limit: 6, city }),
        getPopularSports({ limit: 8 }),
        getHomeStats(),
    ]);

    return {
        popularVenues,
        popularSports,
        stats,
    };
}
