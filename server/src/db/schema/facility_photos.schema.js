import {
    pgTable,
    uuid,
    text,
    integer,
    boolean,
    timestamp,
    index,
    check,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

import { facilities } from './facilities.schema.js';

export const facilityPhotos = pgTable(
    'facility_photos',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        /**
         * CDN/storage URL.
         */
        imageUrl: text('image_url').notNull(),

        /**
         * Provider-specific storage key.
         *
         * Useful for deleting the actual asset later.
         */
        imageKey: text('image_key'),

        displayOrder: integer('display_order').default(0).notNull(),

        /**
         * Only one image per facility may be primary.
         */
        isPrimary: boolean('is_primary').default(false).notNull(),

        createdAt: timestamp('created_at', {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },

    (table) => ({
        facilityIdx: index('facility_photos_facility_id_idx').on(table.facilityId),

        displayOrderCheck: check(
            'facility_photos_display_order_check',
            sql`${table.displayOrder} >= 0`,
        ),

        /**
         * PostgreSQL partial unique index.
         *
         * Ensures:
         *
         * Facility A → maximum ONE primary photo.
         */
        primaryPhotoUnique: uniqueIndex('facility_photos_one_primary_idx')
            .on(table.facilityId)
            .where(sql`${table.isPrimary} = true`),
    }),
);
