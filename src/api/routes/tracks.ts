import { Router, Request, Response } from 'express';

const router = Router();

// GET /tracks - Retrieve the list of planned tracks
router.get('/', async (req: Request, res: Response) => {
  try {
    const plannedTracks = [
      "Performance track"
    ];

    // Send the response with the planned tracks
    res.status(200).json({ plannedTracks });
  } catch (error) {
    console.error('Error retrieving tracks:', error);
    res.status(500).json({ error: 'Internal server error while retrieving track information.' });
  }
});

export default router;