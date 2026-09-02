import { Router } from 'express';
import * as homeController from '../controllers/home.controller.js';
import {
    homeQueryValidator,
    popularVenuesValidator,
    popularSportsValidator,
} from '../validators/home.validator.js';

const router = Router();

// Public routes for home page
router.get('/', homeQueryValidator, homeController.getHomeFeed);
router.get('/popular-venues', popularVenuesValidator, homeController.getPopularVenues);
router.get('/popular-sports', popularSportsValidator, homeController.getPopularSports);

export default router;
