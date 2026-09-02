import { db } from '../config/database.config.js';
import { facilities } from '../db/schema/facilities.schema.js';
import { facilityPhotos } from '../db/schema/facility_photos.schema.js';
import { facilitySports } from '../db/schema/facility_sports.schema.js';
import { facilityAmenities } from '../db/schema/facility_amenities.schema.js';
import { sports } from '../db/schema/sports.schema.js';
import { amenities } from '../db/schema/amenities.schema.js';
import { courts } from '../db/schema/courts.schema.js';
import { eq, and, isNull, sql, ilike, desc, asc, inArray } from 'drizzle-orm';

/**
 * Check if a user is the owner of a facility
 * @param {string} facilityId
 * @param {string} ownerId
 * @returns {Promise<boolean>}
 */
export async function isFacilityOwner(facilityId, ownerId) {
    const [record] = await db
        .select({ id: facilities.id })
        .from(facilities)
        .where(
            and(
                eq(facilities.id, facilityId),
                eq(facilities.ownerId, ownerId),
                isNull(facilities.deletedAt),
            ),
        );
    return Boolean(record);
}

/**
 * Create a new facility with sports and amenities in a transaction
 * @param {object} params
 * @param {object} params.facilityData
 * @param {string[]} [params.sportIds=[]]
 * @param {string[]} [params.amenityIds=[]]
 * @returns {Promise<object>}
 */
export async function createFacility({ facilityData, sportIds = [], amenityIds = [] }) {
    return await db.transaction(async (tx) => {
        const [newFacility] = await tx
            .insert(facilities)
            .values({
                ...facilityData,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        if (sportIds && sportIds.length > 0) {
            const sportsToInsert = sportIds.map((sportId) => ({
                facilityId: newFacility.id,
                sportId,
            }));
            await tx.insert(facilitySports).values(sportsToInsert);
        }

        if (amenityIds && amenityIds.length > 0) {
            const amenitiesToInsert = amenityIds.map((amenityId) => ({
                facilityId: newFacility.id,
                amenityId,
            }));
            await tx.insert(facilityAmenities).values(amenitiesToInsert);
        }

        return newFacility;
    });
}

/**
 * Get paginated facilities belonging to an owner
 * @param {string} ownerId
 * @param {object} filters
 */
export async function getFacilitiesByOwner(ownerId, { status, search, page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [eq(facilities.ownerId, ownerId), isNull(facilities.deletedAt)];

    if (status) {
        conditions.push(eq(facilities.status, status));
    }

    if (search) {
        conditions.push(ilike(facilities.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [countResult] = await db
        .select({ count: sql`count(*)::int` })
        .from(facilities)
        .where(whereClause);
    const total = countResult ? countResult.count : 0;

    // Get paginated facilities
    const facilityList = await db
        .select()
        .from(facilities)
        .where(whereClause)
        .orderBy(desc(facilities.createdAt))
        .limit(limit)
        .offset(offset);

    // Fetch primary photos, active court counts, and sports for each facility
    const enrichedFacilities = await Promise.all(
        facilityList.map(async (fac) => {
            const [primaryPhoto] = await db
                .select({ imageUrl: facilityPhotos.imageUrl })
                .from(facilityPhotos)
                .where(
                    and(eq(facilityPhotos.facilityId, fac.id), eq(facilityPhotos.isPrimary, true)),
                );

            const [courtCount] = await db
                .select({ count: sql`count(*)::int` })
                .from(courts)
                .where(and(eq(courts.facilityId, fac.id), eq(courts.isActive, true)));

            const facilitySportsList = await db
                .select({
                    id: sports.id,
                    name: sports.name,
                    slug: sports.slug,
                })
                .from(facilitySports)
                .innerJoin(sports, eq(facilitySports.sportId, sports.id))
                .where(eq(facilitySports.facilityId, fac.id));

            return {
                ...fac,
                primaryPhotoUrl: primaryPhoto?.imageUrl || null,
                activeCourtsCount: courtCount?.count || 0,
                sports: facilitySportsList,
            };
        }),
    );

    return {
        facilities: enrichedFacilities,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
}

/**
 * Get full facility details including sports, amenities, photos, and courts
 * @param {string} facilityId
 * @returns {Promise<object|null>}
 */
export async function getFacilityDetailsById(facilityId) {
    const [facility] = await db
        .select()
        .from(facilities)
        .where(and(eq(facilities.id, facilityId), isNull(facilities.deletedAt)));

    if (!facility) return null;

    // Fetch sports
    const sportsList = await db
        .select({
            id: sports.id,
            name: sports.name,
            slug: sports.slug,
        })
        .from(facilitySports)
        .innerJoin(sports, eq(facilitySports.sportId, sports.id))
        .where(eq(facilitySports.facilityId, facilityId));

    // Fetch amenities
    const amenitiesList = await db
        .select({
            id: amenities.id,
            name: amenities.name,
        })
        .from(facilityAmenities)
        .innerJoin(amenities, eq(facilityAmenities.amenityId, amenities.id))
        .where(eq(facilityAmenities.facilityId, facilityId));

    // Fetch photos
    const photosList = await db
        .select()
        .from(facilityPhotos)
        .where(eq(facilityPhotos.facilityId, facilityId))
        .orderBy(asc(facilityPhotos.displayOrder), asc(facilityPhotos.createdAt));

    // Fetch courts
    const courtsList = await db
        .select({
            id: courts.id,
            name: courts.name,
            sportId: courts.sportId,
            sportName: sports.name,
            sportSlug: sports.slug,
            priceAmount: courts.priceAmount,
            priceCurrency: courts.priceCurrency,
            isActive: courts.isActive,
            createdAt: courts.createdAt,
        })
        .from(courts)
        .innerJoin(sports, eq(courts.sportId, sports.id))
        .where(eq(courts.facilityId, facilityId))
        .orderBy(asc(courts.name));

    return {
        ...facility,
        sports: sportsList,
        amenities: amenitiesList,
        photos: photosList,
        courts: courtsList,
    };
}

/**
 * Update facility details and sync sports/amenities in a transaction
 * @param {string} facilityId
 * @param {object} updates
 * @param {object} relations
 * @param {string[]} [relations.sportIds]
 * @param {string[]} [relations.amenityIds]
 */
export async function updateFacility(facilityId, updates = {}, { sportIds, amenityIds } = {}) {
    return await db.transaction(async (tx) => {
        let updatedFacility = null;

        if (Object.keys(updates).length > 0) {
            const [result] = await tx
                .update(facilities)
                .set({
                    ...updates,
                    updatedAt: new Date(),
                })
                .where(and(eq(facilities.id, facilityId), isNull(facilities.deletedAt)))
                .returning();
            updatedFacility = result;
        }

        if (Array.isArray(sportIds)) {
            await tx.delete(facilitySports).where(eq(facilitySports.facilityId, facilityId));
            if (sportIds.length > 0) {
                const sportsToInsert = sportIds.map((sportId) => ({
                    facilityId,
                    sportId,
                }));
                await tx.insert(facilitySports).values(sportsToInsert);
            }
        }

        if (Array.isArray(amenityIds)) {
            await tx.delete(facilityAmenities).where(eq(facilityAmenities.facilityId, facilityId));
            if (amenityIds.length > 0) {
                const amenitiesToInsert = amenityIds.map((amenityId) => ({
                    facilityId,
                    amenityId,
                }));
                await tx.insert(facilityAmenities).values(amenitiesToInsert);
            }
        }

        return updatedFacility || (await getFacilityDetailsById(facilityId));
    });
}

/**
 * Soft delete a facility and deactivate all its courts
 * @param {string} facilityId
 */
export async function softDeleteFacility(facilityId) {
    return await db.transaction(async (tx) => {
        const now = new Date();
        const [deletedFacility] = await tx
            .update(facilities)
            .set({
                deletedAt: now,
                updatedAt: now,
            })
            .where(eq(facilities.id, facilityId))
            .returning();

        // Deactivate all courts under this facility
        await tx
            .update(courts)
            .set({
                isActive: false,
                updatedAt: now,
            })
            .where(eq(courts.facilityId, facilityId));

        return deletedFacility;
    });
}

/**
 * Get count of photos for a facility
 * @param {string} facilityId
 * @returns {Promise<number>}
 */
export async function getPhotosCount(facilityId) {
    const [result] = await db
        .select({ count: sql`count(*)::int` })
        .from(facilityPhotos)
        .where(eq(facilityPhotos.facilityId, facilityId));
    return result ? result.count : 0;
}

/**
 * Add photos to a facility
 * @param {object[]} photoRecords
 */
export async function addFacilityPhotos(photoRecords) {
    if (!photoRecords || photoRecords.length === 0) return [];
    return await db.insert(facilityPhotos).values(photoRecords).returning();
}

/**
 * Get a specific photo by ID and facility ID
 * @param {string} photoId
 * @param {string} facilityId
 */
export async function getPhotoById(photoId, facilityId) {
    const [photo] = await db
        .select()
        .from(facilityPhotos)
        .where(and(eq(facilityPhotos.id, photoId), eq(facilityPhotos.facilityId, facilityId)));
    return photo || null;
}

/**
 * Delete a photo by ID
 * @param {string} photoId
 * @param {string} facilityId
 */
export async function deleteFacilityPhoto(photoId, facilityId) {
    const [deleted] = await db
        .delete(facilityPhotos)
        .where(and(eq(facilityPhotos.id, photoId), eq(facilityPhotos.facilityId, facilityId)))
        .returning();
    return deleted || null;
}

/**
 * Set a photo as primary (unsetting any existing primary photo for that facility)
 * @param {string} facilityId
 * @param {string} photoId
 */
export async function setPrimaryPhoto(facilityId, photoId) {
    return await db.transaction(async (tx) => {
        // Demote all
        await tx
            .update(facilityPhotos)
            .set({ isPrimary: false })
            .where(eq(facilityPhotos.facilityId, facilityId));

        // Promote target
        const [updated] = await tx
            .update(facilityPhotos)
            .set({ isPrimary: true })
            .where(and(eq(facilityPhotos.id, photoId), eq(facilityPhotos.facilityId, facilityId)))
            .returning();
        return updated;
    });
}

/**
 * Promote the first photo with lowest display order to primary
 * @param {string} facilityId
 */
export async function promoteNextPrimaryPhoto(facilityId) {
    const [nextPhoto] = await db
        .select({ id: facilityPhotos.id })
        .from(facilityPhotos)
        .where(eq(facilityPhotos.facilityId, facilityId))
        .orderBy(asc(facilityPhotos.displayOrder), asc(facilityPhotos.createdAt))
        .limit(1);

    if (nextPhoto) {
        await db
            .update(facilityPhotos)
            .set({ isPrimary: true })
            .where(eq(facilityPhotos.id, nextPhoto.id));
    }
}
