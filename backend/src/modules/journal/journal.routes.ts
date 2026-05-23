import { Router } from 'express';
import * as controller from './journal.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/',                           controller.createEntry);
router.get('/',                            controller.getEntries);
router.get('/stats',                       controller.getStats);
router.get('/calendar/:year/:month',       controller.getCalendarEntries);
router.get('/:id',                         controller.getEntry);
router.put('/:id',                         controller.updateEntry);
router.delete('/:id',                      controller.deleteEntry);

export { router as journalRouter };
