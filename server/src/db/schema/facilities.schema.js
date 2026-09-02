import { pgTable, uuid, text, numeric, timestamp, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { users } from './users.schema.js';

import { facilityStatusEnum, venueTypeEnum } from './enums.schema.js';

export const facilities = pgTable(
    'facilities',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        /**
         * Facility owner.
         *
         * Backend MUST verify:
         *
         * users.role === 'facility_owner'
         */
        ownerId: uuid('owner_id')
            .references(() => users.id, {
                onDelete: 'restrict',
            })
            .notNull(),

        name: text('name').notNull(),

        description: text('description'),

        addressLine: text('address_line').notNull(),

        city: text('city').notNull(),

        state: text('state').notNull(),

        postalCode: text('postal_code'),

        latitude: numeric('latitude', {
            precision: 9,
            scale: 6,
        }),

        longitude: numeric('longitude', {
            precision: 9,
            scale: 6,
        }),

        venueType: venueTypeEnum('venue_type').notNull(),

        /**
         * New facilities start as PENDING.
         *
         * Public discovery MUST only return APPROVED
         * facilities.
         */
        status: facilityStatusEnum('status').default('PENDING').notNull(),

        /**
         * Populated when an admin rejects a facility.
         */
        rejectionReason: text('rejection_reason'),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updatedAt: timestamp('updated_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        /**
         * Soft deletion.
         *
         * Do NOT hard-delete facilities because historical
         * bookings/reviews/payments may reference them.
         */
        deletedAt: timestamp('deleted_at', {
            withTimezone: true,
        }),
    },

    (table) => ({
        ownerIdx: index('facilities_owner_id_idx').on(table.ownerId),

        statusIdx: index('facilities_status_idx').on(table.status),

        cityIdx: index('facilities_city_idx').on(table.city),

        venueTypeIdx: index('facilities_venue_type_idx').on(table.venueType),

        latitudeCheck: check(
            'facilities_latitude_valid',
            sql`latitude IS NULL
             OR latitude BETWEEN -90 AND 90`,
        ),

        longitudeCheck: check(
            'facilities_longitude_valid',
            sql`longitude IS NULL
             OR longitude BETWEEN -180 AND 180`,
        ),
    }),
);
