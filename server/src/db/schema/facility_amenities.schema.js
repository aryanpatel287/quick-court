import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';

import { facilities } from './facilities.schema.js';
import { amenities } from './amenities.schema.js';

export const facilityAmenities = pgTable(
    'facility_amenities',
    {
        facilityId: uuid('facility_id')
            .references(() => facilities.id, {
                onDelete: 'cascade',
            })
            .notNull(),

        amenityId: uuid('amenity_id')
            .references(() => amenities.id, {
                onDelete: 'restrict',
            })
            .notNull(),
    },

    (table) => ({
        pk: primaryKey({
            columns: [table.facilityId, table.amenityId],
        }),
    }),
);
