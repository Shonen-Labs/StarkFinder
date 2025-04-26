import { prisma } from '@/lib/devxstark/prisma'; 
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; 

  if (typeof id !== 'string') {
    
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        deployedContracts: true,
        generatedContracts: true,
      },
    });

    if (!user) {
      // If no user is found, return a 404
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user and their contracts
    res.json(user);
  } catch (error) {
    // Handle any unexpected errors
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}
