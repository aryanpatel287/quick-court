import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, pool } from '../config/database.config.js';
import { users } from './schema/users.schema.js';
import { sports } from './schema/sports.schema.js';
import { amenities } from './schema/amenities.schema.js';
import { facilities } from './schema/facilities.schema.js';
import { facilitySports } from './schema/facility_sports.schema.js';
import { facilityAmenities } from './schema/facility_amenities.schema.js';
import { facilityPhotos } from './schema/facility_photos.schema.js';
import { courts } from './schema/courts.schema.js';
import { courtOperatingHours } from './schema/court_operating_hours.schema.js';
import { maintenanceBlocks } from './schema/maintenance_blocks.schema.js';
import { bookings } from './schema/bookings.schema.js';
import { payments } from './schema/payments.schema.js';
import { reviews } from './schema/reviews.schema.js';
import { eq, and, sql } from 'drizzle-orm';

/**
 * 1. Seed Mandatory Login Credentials
 */
async function seedUsers() {
    console.log('--- Seeding Credentials ---');
    const userCredentials = [
        {
            role: 'ADMIN',
            firstName: 'Aryan',
            lastName: 'Patel',
            email: 'aryanpatel.me@gmail.com',
            rawPassword: 'Aryan@123',
        },
        {
            role: 'ADMIN',
            firstName: 'Itesh',
            lastName: 'Prajapati',
            email: 'iteshofficial@gmail.com',
            rawPassword: 'Itesh@123',
        },
        {
            role: 'ADMIN',
            firstName: 'Asr',
            lastName: 'Singh',
            email: 'asr24983@gmail.com',
            rawPassword: 'Asr@123',
        },
        {
            role: 'USER',
            firstName: 'Ankur',
            lastName: 'Singh',
            email: 'asrajput5656@gmail.com',
            rawPassword: 'Ankur@123',
        },
        {
            role: 'ADMIN',
            firstName: 'Aman',
            lastName: 'Yadav',
            email: 'yadavaman1948@gmail.com',
            rawPassword: 'Aman@123',
        },
        {
            role: 'FACILITY_OWNER',
            firstName: 'Leo',
            lastName: 'Patel',
            email: 'leopatel967@gmail.com',
            rawPassword: 'Leo@123',
        },
        {
            role: 'FACILITY_OWNER',
            firstName: 'Doom',
            lastName: 'Wiser',
            email: 'doomwiser@gmail.com',
            rawPassword: 'Doom@123',
        },
        {
            role: 'FACILITY_OWNER',
            firstName: 'Priya',
            lastName: 'Nair',
            email: 'hr@example.com',
            rawPassword: 'Priya@123',
        },
        {
            role: 'FACILITY_OWNER',
            firstName: 'Aman',
            lastName: 'Yadav',
            email: 'work.yadavaman@gmail.com',
            rawPassword: 'Aman@123',
        },
        {
            role: 'USER',
            firstName: 'Sky',
            lastName: 'High',
            email: 'skyh53624@gmail.com',
            rawPassword: 'Sky@123',
        },
        {
            role: 'USER',
            firstName: 'Aman',
            lastName: 'Yadav',
            email: 'yadavaman1388@example.com',
            rawPassword: 'Aman@123',
        },
    ];

    const seededUsersMap = {};

    for (const cred of userCredentials) {
        const hashedPassword = await bcrypt.hash(cred.rawPassword, 10);
        const normalizedEmail = cred.email.toLowerCase().trim();

        const [user] = await db
            .insert(users)
            .values({
                firstName: cred.firstName,
                lastName: cred.lastName,
                email: normalizedEmail,
                password: hashedPassword,
                role: cred.role,
                emailVerified: true,
                isActive: true,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: users.email,
                set: {
                    firstName: cred.firstName,
                    lastName: cred.lastName,
                    password: hashedPassword,
                    role: cred.role,
                    emailVerified: true,
                    isActive: true,
                    isDeleted: false,
                    updatedAt: new Date(),
                },
            })
            .returning();

        seededUsersMap[normalizedEmail] = user;
        console.log(
            `[USER] ${cred.role.padEnd(14)} | ${cred.firstName} ${cred.lastName.padEnd(10)} | ${normalizedEmail}`,
        );
    }

    return seededUsersMap;
}

/**
 * 2. Seed Sports Catalog
 */
async function seedSports() {
    console.log('\n--- Seeding Sports ---');
    const sportsData = [
        { name: 'Badminton', slug: 'badminton' },
        { name: 'Football Turf', slug: 'football-turf' },
        { name: 'Box Cricket', slug: 'box-cricket' },
        { name: 'Lawn Tennis', slug: 'lawn-tennis' },
        { name: 'Table Tennis', slug: 'table-tennis' },
        { name: 'Basketball', slug: 'basketball' },
        { name: 'Swimming', slug: 'swimming' },
        { name: 'Squash', slug: 'squash' },
    ];

    const sportsMap = {};

    for (const s of sportsData) {
        const [sport] = await db
            .insert(sports)
            .values({
                name: s.name,
                slug: s.slug,
                isActive: true,
            })
            .onConflictDoUpdate({
                target: sports.name,
                set: { slug: s.slug, isActive: true },
            })
            .returning();

        sportsMap[s.slug] = sport;
        console.log(`[SPORT] ${sport.name} (${sport.slug})`);
    }

    return sportsMap;
}

/**
 * 3. Seed Amenities Catalog
 */
async function seedAmenities() {
    console.log('\n--- Seeding Amenities ---');
    const amenitiesData = [
        'Covered Parking',
        'Drinking Water',
        'Changing Room & Lockers',
        'Shower Facilities',
        'Equipment Rental',
        'Floodlights',
        'Sports Cafeteria',
        'First Aid Kit',
        'Air Conditioned Viewing Area',
        'Free Wi-Fi',
    ];

    const amenitiesMap = {};

    for (const name of amenitiesData) {
        const [amenity] = await db
            .insert(amenities)
            .values({ name, isActive: true })
            .onConflictDoUpdate({
                target: amenities.name,
                set: { isActive: true },
            })
            .returning();

        amenitiesMap[name] = amenity;
        console.log(`[AMENITY] ${amenity.name}`);
    }

    return amenitiesMap;
}

/**
 * 4. Seed Realistic Indian Facilities, Photos, Courts & Schedules
 */
async function seedFacilitiesAndCourts(usersMap, sportsMap, amenitiesMap) {
    console.log('\n--- Seeding Indian Sports Facilities & Courts ---');

    const facilitiesDefinitions = [
        {
            ownerEmail: 'leopatel967@gmail.com',
            name: 'Padukone - Dravid Sports Excellence Hub',
            description:
                'State-of-the-art international badminton and multi-racquet sports arena in Koramangala. Features 6 BWF tournament grade synthetic courts with anti-glare high-bay LED lighting, dedicated warm-up zone, and pro shop.',
            addressLine: '80 Feet Road, 4th Block, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560034',
            latitude: '12.935242',
            longitude: '77.624462',
            venueType: 'INDOOR',
            status: 'APPROVED',
            sports: ['badminton', 'table-tennis', 'squash'],
            amenities: [
                'Covered Parking',
                'Drinking Water',
                'Changing Room & Lockers',
                'Shower Facilities',
                'Air Conditioned Viewing Area',
                'Free Wi-Fi',
            ],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 1,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 2,
                },
            ],
            courts: [
                { name: 'BWF Court 1 (Green Mat)', sportSlug: 'badminton', price: '550.00' },
                { name: 'BWF Court 2 (Green Mat)', sportSlug: 'badminton', price: '550.00' },
                { name: 'Classic Wooden Court A', sportSlug: 'badminton', price: '450.00' },
                { name: 'Stag Championship Table 1', sportSlug: 'table-tennis', price: '250.00' },
                { name: 'Glass-back Squash Court 1', sportSlug: 'squash', price: '600.00' },
            ],
        },
        {
            ownerEmail: 'doomwiser@gmail.com',
            name: 'Shivaji Park Athletic Turf & Box Arena',
            description:
                'Premier Mumbai sports destination located adjoining historic Shivaji Park. High-density monofilament 5-a-side and 7-a-side football turf with all-weather shock pads, and enclosed floodlit box cricket arena.',
            addressLine: 'Cadell Road, Shivaji Park, Dadar West',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400028',
            latitude: '19.026875',
            longitude: '72.837562',
            venueType: 'SPORTS_COMPLEX',
            status: 'APPROVED',
            sports: ['football-turf', 'box-cricket', 'basketball'],
            amenities: [
                'Floodlights',
                'Covered Parking',
                'Drinking Water',
                'Sports Cafeteria',
                'First Aid Kit',
            ],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 1,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 2,
                },
            ],
            courts: [
                {
                    name: 'FIFA Star AstroTurf A (5v5)',
                    sportSlug: 'football-turf',
                    price: '1400.00',
                },
                {
                    name: 'FIFA Star AstroTurf B (5v5)',
                    sportSlug: 'football-turf',
                    price: '1400.00',
                },
                { name: 'Box Cricket Pitch Alpha', sportSlug: 'box-cricket', price: '900.00' },
                { name: 'Box Cricket Pitch Beta', sportSlug: 'box-cricket', price: '900.00' },
                { name: 'FIBA Outdoor Basketball Court', sportSlug: 'basketball', price: '600.00' },
            ],
        },
        {
            ownerEmail: 'hr@example.com',
            name: 'Dhyan Chand Tennis & Aquatic Club',
            description:
                'Lush green sporting oasis in the heart of Central Delhi. Offering 4 Roland Garros red clay courts, 2 US Open DecoTurf hard courts, and a FINA approved semi-Olympic 25-meter temperature-regulated pool.',
            addressLine: 'Copernicus Marg, Near Mandi House & India Gate',
            city: 'New Delhi',
            state: 'Delhi',
            postalCode: '110001',
            latitude: '28.618920',
            longitude: '77.234150',
            venueType: 'OUTDOOR',
            status: 'APPROVED',
            sports: ['lawn-tennis', 'swimming', 'badminton'],
            amenities: [
                'Covered Parking',
                'Shower Facilities',
                'Changing Room & Lockers',
                'First Aid Kit',
                'Equipment Rental',
                'Sports Cafeteria',
            ],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 1,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 2,
                },
            ],
            courts: [
                { name: 'Centre Clay Tennis Court', sportSlug: 'lawn-tennis', price: '800.00' },
                { name: 'DecoTurf Hard Court 1', sportSlug: 'lawn-tennis', price: '700.00' },
                { name: 'Olympic Lap Pool Lane 1', sportSlug: 'swimming', price: '350.00' },
                { name: 'Outdoor Badminton Court 1', sportSlug: 'badminton', price: '350.00' },
            ],
        },
        {
            ownerEmail: 'work.yadavaman@gmail.com',
            name: 'CyberCity Smashers & Turf Arena',
            description:
                'Gurugram’s flagship 24x7 sports venue right behind Leisure Valley. Features 4 Yonex court mats, a 7-a-side AstroTurf football ground, and high-intensity neon night cricket facilities.',
            addressLine: 'Sector 29, Behind Leisure Valley Park',
            city: 'Gurugram',
            state: 'Haryana',
            postalCode: '122002',
            latitude: '28.468245',
            longitude: '77.062832',
            venueType: 'SPORTS_COMPLEX',
            status: 'APPROVED',
            sports: ['badminton', 'football-turf', 'box-cricket'],
            amenities: [
                'Floodlights',
                'Air Conditioned Viewing Area',
                'Free Wi-Fi',
                'Sports Cafeteria',
                'Shower Facilities',
                'Equipment Rental',
            ],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1518604666864-742395639b8d?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&auto=format&fit=crop',
                    isPrimary: false,
                    displayOrder: 1,
                },
            ],
            courts: [
                { name: 'Yonex Pro Synthetic Court 1', sportSlug: 'badminton', price: '500.00' },
                { name: 'Yonex Pro Synthetic Court 2', sportSlug: 'badminton', price: '500.00' },
                { name: '7-a-side Football Turf', sportSlug: 'football-turf', price: '1600.00' },
                { name: 'Floodlit Box Cricket Arena', sportSlug: 'box-cricket', price: '1000.00' },
            ],
        },
        {
            ownerEmail: 'leopatel967@gmail.com',
            name: 'Sardar Vallabhbhai Patel Sports Enclave',
            description:
                'Newly constructed multi-discipline complex in Navrangpura awaiting final admin accreditation. Modern wooden court flooring and collegiate basketball training grounds.',
            addressLine: 'Stadium Cross Road, Navrangpura',
            city: 'Ahmedabad',
            state: 'Gujarat',
            postalCode: '380009',
            latitude: '23.037410',
            longitude: '72.551220',
            venueType: 'SPORTS_COMPLEX',
            status: 'PENDING', // PENDING for Admin testing!
            sports: ['badminton', 'basketball', 'table-tennis'],
            amenities: ['Covered Parking', 'Drinking Water', 'Changing Room & Lockers'],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
            ],
            courts: [
                { name: 'Training Badminton Court A', sportSlug: 'badminton', price: '400.00' },
                { name: 'Training Badminton Court B', sportSlug: 'badminton', price: '400.00' },
            ],
        },
        {
            ownerEmail: 'doomwiser@gmail.com',
            name: 'Kanteerava Recreation & Tennis Zone',
            description:
                'Outdoor recreational sports club near Corporation Circle. Features tennis clay courts and open badminton court.',
            addressLine: 'Sampangi Rama Nagar, Near Corporation Circle',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            latitude: '12.969812',
            longitude: '77.592734',
            venueType: 'OUTDOOR',
            status: 'REJECTED', // REJECTED for Admin testing!
            rejectionReason:
                'Emergency exits and floodlight electrical inspection certifications were not attached. Please resubmit with fire department clearance.',
            sports: ['lawn-tennis', 'basketball'],
            amenities: ['Covered Parking', 'Drinking Water'],
            photos: [
                {
                    imageUrl:
                        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1200&auto=format&fit=crop',
                    isPrimary: true,
                    displayOrder: 0,
                },
            ],
            courts: [
                { name: 'Recreation Tennis Court 1', sportSlug: 'lawn-tennis', price: '500.00' },
            ],
        },
    ];

    const seededCourts = [];
    const seededFacilities = [];

    for (const def of facilitiesDefinitions) {
        const owner = usersMap[def.ownerEmail.toLowerCase()];
        if (!owner) {
            console.warn(`Owner ${def.ownerEmail} not found. Skipping facility ${def.name}`);
            continue;
        }

        // Check or insert facility
        let [fac] = await db
            .select()
            .from(facilities)
            .where(and(eq(facilities.ownerId, owner.id), eq(facilities.name, def.name)));

        if (!fac) {
            [fac] = await db
                .insert(facilities)
                .values({
                    ownerId: owner.id,
                    name: def.name,
                    description: def.description,
                    addressLine: def.addressLine,
                    city: def.city,
                    state: def.state,
                    postalCode: def.postalCode,
                    latitude: def.latitude,
                    longitude: def.longitude,
                    venueType: def.venueType,
                    status: def.status,
                    rejectionReason: def.rejectionReason || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();
            console.log(`[FACILITY] ${fac.status.padEnd(9)} | ${fac.name} (${fac.city})`);
        } else {
            console.log(`[FACILITY EXISTS] ${fac.name}`);
        }

        seededFacilities.push(fac);

        // Link Sports
        for (const slug of def.sports) {
            const sportObj = sportsMap[slug];
            if (sportObj) {
                await db
                    .insert(facilitySports)
                    .values({ facilityId: fac.id, sportId: sportObj.id })
                    .onConflictDoNothing();
            }
        }

        // Link Amenities
        for (const amenName of def.amenities) {
            const amenObj = amenitiesMap[amenName];
            if (amenObj) {
                await db
                    .insert(facilityAmenities)
                    .values({ facilityId: fac.id, amenityId: amenObj.id })
                    .onConflictDoNothing();
            }
        }

        // Seed Photos
        for (const photo of def.photos) {
            const [existingPhoto] = await db
                .select({ id: facilityPhotos.id })
                .from(facilityPhotos)
                .where(
                    and(
                        eq(facilityPhotos.facilityId, fac.id),
                        eq(facilityPhotos.imageUrl, photo.imageUrl),
                    ),
                );

            if (!existingPhoto) {
                await db.insert(facilityPhotos).values({
                    facilityId: fac.id,
                    imageUrl: photo.imageUrl,
                    displayOrder: photo.displayOrder,
                    isPrimary: photo.isPrimary,
                });
            }
        }

        // Seed Courts & Operating Hours
        for (const c of def.courts) {
            const sportObj = sportsMap[c.sportSlug];
            if (!sportObj) continue;

            let [courtRecord] = await db
                .select()
                .from(courts)
                .where(and(eq(courts.facilityId, fac.id), eq(courts.name, c.name)));

            if (!courtRecord) {
                [courtRecord] = await db
                    .insert(courts)
                    .values({
                        facilityId: fac.id,
                        sportId: sportObj.id,
                        name: c.name,
                        priceAmount: c.price,
                        priceCurrency: 'INR',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .returning();

                // Seed 7-day operating hours (06:00 to 22:00)
                for (let day = 0; day <= 6; day++) {
                    await db
                        .insert(courtOperatingHours)
                        .values({
                            courtId: courtRecord.id,
                            dayOfWeek: day,
                            startTime: '06:00:00',
                            endTime: '22:00:00',
                            isClosed: false,
                        })
                        .onConflictDoNothing();
                }

                console.log(`  └─ [COURT] ${courtRecord.name} (₹${courtRecord.priceAmount}/hr)`);
            }

            seededCourts.push({
                ...courtRecord,
                facilityName: fac.name,
                facilityId: fac.id,
            });
        }
    }

    return { seededFacilities, seededCourts };
}

/**
 * 5. Seed Maintenance Blocks, Bookings, Simulated Payments & Reviews
 */
async function seedBookingsAndReviews(usersMap, courts) {
    console.log('\n--- Seeding Maintenance, Bookings, Payments & Reviews ---');

    const ankur = usersMap['asrajput5656@gmail.com'];
    const sky = usersMap['skyh53624@gmail.com'];
    const amanUser = usersMap['yadavaman1388@example.com'];

    if (!ankur || !sky || !amanUser || courts.length === 0) {
        console.warn('Missing test users or courts for booking simulation. Skipping...');
        return;
    }

    const court1 = courts.find((c) => c.name.includes('BWF Court 1')) || courts[0];
    const court2 = courts.find((c) => c.name.includes('AstroTurf A')) || courts[1] || courts[0];
    const court3 = courts.find((c) => c.name.includes('Centre Clay')) || courts[2] || courts[0];
    const court4 = courts.find((c) => c.name.includes('Yonex Pro')) || courts[3] || courts[0];
    const court5 =
        courts.find((c) => c.name.includes('Box Cricket Pitch Alpha')) || courts[4] || courts[0];

    // 1. Seed Maintenance Blocks
    const maintenanceDateStart = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days later
    maintenanceDateStart.setHours(13, 0, 0, 0);
    const maintenanceDateEnd = new Date(maintenanceDateStart.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    await db
        .insert(maintenanceBlocks)
        .values({
            courtId: court1.id,
            createdBy: court1.facilityId ? usersMap['leopatel967@gmail.com'].id : ankur.id,
            startTime: maintenanceDateStart,
            endTime: maintenanceDateEnd,
            reason: 'BWF synthetic mat deep cleaning and line inspection',
            createdAt: new Date(),
        })
        .onConflictDoNothing();
    console.log(`[MAINTENANCE] Scheduled on ${court1.name} (13:00 - 15:00 in 2 days)`);

    // Helper to format booking ref
    const makeRef = (num) => `BK-02092026-${String(num).padStart(6, '0')}`;

    // 2. Booking Data Definitions
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const bookingEntries = [
        {
            refNum: 101,
            user: ankur,
            court: court1,
            startTime: new Date(now - 2 * oneDay + 18 * 3600 * 1000), // 2 days ago 18:00
            endTime: new Date(now - 2 * oneDay + 19 * 3600 * 1000), // 2 days ago 19:00
            durationMinutes: 60,
            status: 'COMPLETED',
            rating: 5,
            comment:
                'Fantastic BWF certified court! The synthetic mat offers great grip and the high-bay LEDs don’t glare during smashes. Excellent changing room facilities.',
        },
        {
            refNum: 102,
            user: ankur,
            court: court2,
            startTime: new Date(now + 1 * oneDay + 20 * 3600 * 1000), // Tomorrow 20:00
            endTime: new Date(now + 1 * oneDay + 21 * 3600 * 1000), // Tomorrow 21:00
            durationMinutes: 60,
            status: 'CONFIRMED',
        },
        {
            refNum: 103,
            user: sky,
            court: court3,
            startTime: new Date(now - 3 * oneDay + 7 * 3600 * 1000), // 3 days ago 07:00
            endTime: new Date(now - 3 * oneDay + 8.5 * 3600 * 1000), // 3 days ago 08:30
            durationMinutes: 90,
            status: 'COMPLETED',
            rating: 5,
            comment:
                'One of the best clay tennis courts in Central Delhi. Well rolled, proper line tapes, and cold showers ready post-match. Will definitely book weekly!',
        },
        {
            refNum: 104,
            user: sky,
            court: court4,
            startTime: new Date(now + 3 * oneDay + 19 * 3600 * 1000), // 3 days from now
            endTime: new Date(now + 3 * oneDay + 20 * 3600 * 1000),
            durationMinutes: 60,
            status: 'CONFIRMED',
        },
        {
            refNum: 105,
            user: amanUser,
            court: court5,
            startTime: new Date(now - 1 * oneDay + 21 * 3600 * 1000), // Yesterday 21:00
            endTime: new Date(now - 1 * oneDay + 22.5 * 3600 * 1000),
            durationMinutes: 90,
            status: 'COMPLETED',
            rating: 4,
            comment:
                'Thrilling box cricket match under bright floodlights! Turf bounce was consistent and nets are well maintained. Juice bar is a great bonus.',
        },
        {
            refNum: 106,
            user: amanUser,
            court: court1,
            startTime: new Date(now + 2 * oneDay + 17 * 3600 * 1000),
            endTime: new Date(now + 2 * oneDay + 18 * 3600 * 1000),
            durationMinutes: 60,
            status: 'CANCELLED',
            cancelledAt: new Date(now - 3600 * 1000),
            cancellationReason: 'Urgent office travel and client presentation.',
        },
    ];

    for (const b of bookingEntries) {
        const ref = makeRef(b.refNum);
        const pricePerHr = parseFloat(b.court.priceAmount);
        const totalAmount = ((pricePerHr * b.durationMinutes) / 60).toFixed(2);

        let [bookingRecord] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.bookingReference, ref));

        if (!bookingRecord) {
            [bookingRecord] = await db
                .insert(bookings)
                .values({
                    bookingReference: ref,
                    userId: b.user.id,
                    courtId: b.court.id,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    durationMinutes: b.durationMinutes,
                    priceAmount: b.court.priceAmount,
                    priceCurrency: 'INR',
                    totalAmount: String(totalAmount),
                    totalCurrency: 'INR',
                    status: b.status,
                    cancelledAt: b.cancelledAt || null,
                    cancellationReason: b.cancellationReason || null,
                    createdAt: new Date(b.startTime.getTime() - 4 * 3600 * 1000),
                    updatedAt: new Date(),
                })
                .returning();

            console.log(
                `[BOOKING] ${bookingRecord.status.padEnd(9)} | ${ref} | ${b.court.name} | ₹${totalAmount}`,
            );
        }

        // Seed Payment Record
        const [existingPayment] = await db
            .select()
            .from(payments)
            .where(eq(payments.bookingId, bookingRecord.id));

        if (!existingPayment) {
            await db.insert(payments).values({
                bookingId: bookingRecord.id,
                orderId: `SIM_ORD_${b.refNum}`,
                paymentId: `SIM_PAY_${b.refNum}_OK`,
                signature: `SIM_SIG_${b.refNum}`,
                amount: String(totalAmount),
                currency: 'INR',
                status: 'SUCCESS',
                paidAt: new Date(bookingRecord.createdAt.getTime() + 120 * 1000),
                createdAt: bookingRecord.createdAt,
                updatedAt: new Date(),
            });
        }

        // Seed Review if completed
        if (b.status === 'COMPLETED' && b.rating && b.comment) {
            const [existingReview] = await db
                .select()
                .from(reviews)
                .where(and(eq(reviews.userId, b.user.id), eq(reviews.bookingId, bookingRecord.id)));

            if (!existingReview) {
                await db.insert(reviews).values({
                    facilityId: b.court.facilityId,
                    userId: b.user.id,
                    bookingId: bookingRecord.id,
                    rating: b.rating,
                    comment: b.comment,
                    createdAt: new Date(b.endTime.getTime() + 30 * 60 * 1000),
                    updatedAt: new Date(),
                });
                console.log(
                    `  └─ [REVIEW] ${b.rating}★ from ${b.user.firstName}: "${b.comment.substring(0, 50)}..."`,
                );
            }
        }
    }
}

/**
 * Main Seeding Pipeline
 */
async function main() {
    console.log('====================================================');
    console.log('       QUICKCOURT DATABASE SEEDING ENGINE           ');
    console.log('====================================================\n');

    try {
        const usersMap = await seedUsers();
        const sportsMap = await seedSports();
        const amenitiesMap = await seedAmenities();
        const { seededFacilities, seededCourts } = await seedFacilitiesAndCourts(
            usersMap,
            sportsMap,
            amenitiesMap,
        );
        await seedBookingsAndReviews(usersMap, seededCourts);

        console.log('\n====================================================');
        console.log('  ALL REALISTIC INDIAN SEED DATA POPULATED SUCCESSFULLY');
        console.log('====================================================\n');
    } catch (err) {
        console.error('CRITICAL ERROR DURING SEEDING:', err);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
