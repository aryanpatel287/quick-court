import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

import { roleEnum } from './enums.schema.js';

export const users = pgTable(
    'users',
    {
        id: uuid('id').defaultRandom().primaryKey(),

        firstName: text('first_name').notNull(),

        lastName: text('last_name').notNull(),

        /**
         * Email must be normalized to lowercase by the service
         * before insertion/update.
         */
        email: text('email').notNull(),

        /**
         * Nullable for OAuth users.
         */
        password: text('password'),

        /**
         * Google OAuth identifier.
         */
        googleId: text('google_id'),

        profileImage: text('profile_image'),

        /**
         * NEVER trust role from public registration input.
         *
         * Normal signup should create USER accounts.
         * Facility-owner/admin assignment must be controlled
         * by authorized backend logic.
         */
        role: roleEnum('role').default('USER').notNull(),

        emailVerified: boolean('email_verified').default(false).notNull(),

        /**
         * false = banned/disabled.
         */
        isActive: boolean('is_active').default(true).notNull(),

        /**
         * Soft deletion preserves historical relationships.
         */
        isDeleted: boolean('is_deleted').default(false).notNull(),

        deletedAt: timestamp('deleted_at', {
            withTimezone: true,
        }),

        recoveryExpiresAt: timestamp('recovery_expires_at', {
            withTimezone: true,
        }),

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
    },

    (table) => ({
        /**
         * Case-insensitive uniqueness is preferably enforced
         * through normalized lowercase email in the service.
         *
         * If you want DB-level case-insensitive uniqueness,
         * use a PostgreSQL functional unique index:
         *
         * UNIQUE (LOWER(email))
         */
        emailUniqueIdx: uniqueIndex('users_email_unique_idx').on(table.email),

        googleIdUniqueIdx: uniqueIndex('users_google_id_unique_idx').on(table.googleId),

        roleIdx: index('users_role_idx').on(table.role),

        activeIdx: index('users_active_idx').on(table.isActive),

        deletedIdx: index('users_deleted_idx').on(table.isDeleted),
    }),
);
