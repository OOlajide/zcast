import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../../../lib/redis';

// Type definition for podcast metadata
interface PodcastMetadata {
  fid: string;
  prompt: string;
  blobUrl: string;
  timestamp: number;
}

// POST /api/podcasts - Save a new podcast entry
export async function POST(request: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fid, prompt, blobUrl, timestamp }: PodcastMetadata = body;

    // Validate required fields
    if (!fid || !prompt || !blobUrl || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, prompt, blobUrl, timestamp' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof fid !== 'string' || typeof prompt !== 'string' || typeof blobUrl !== 'string' || typeof timestamp !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data types. fid, prompt, blobUrl must be strings, timestamp must be number' },
        { status: 400 }
      );
    }

    const podcastData: PodcastMetadata = {
      fid,
      prompt,
      blobUrl,
      timestamp
    };

    // Save to Redis list for the user's fid
    const redisKey = `podcasts:${fid}`;
    await redis.lpush(redisKey, JSON.stringify(podcastData));

    console.log(`Saved podcast metadata for FID ${fid}:`, podcastData);

    return NextResponse.json({ 
      success: true, 
      message: 'Podcast metadata saved successfully',
      data: podcastData
    });

  } catch (error) {
    console.error('Error saving podcast metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save podcast metadata' },
      { status: 500 }
    );
  }
}

// GET /api/podcasts?fid=... - Retrieve all podcasts for a given fid
export async function GET(request: NextRequest) {
  try {
    if (!redis) {
      return NextResponse.json(
        { error: 'Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'fid parameter is required' },
        { status: 400 }
      );
    }

    // Retrieve all podcasts for the user
    const redisKey = `podcasts:${fid}`;
    
    // Try different Redis methods to debug
    console.log(`Querying Redis with key: ${redisKey}`);
    
    // First, check if the key exists
    const keyExists = await redis.exists(redisKey);
    console.log(`Key exists: ${keyExists}`);
    
    // Get the list length
    const listLength = await redis.llen(redisKey);
    console.log(`List length: ${listLength}`);
    
    // Try to get the data
    const podcastDataList = await redis.lrange(redisKey, 0, -1);
    console.log(`Raw Redis response:`, podcastDataList);
    console.log(`Redis response type:`, typeof podcastDataList);
    console.log(`Redis response length:`, Array.isArray(podcastDataList) ? podcastDataList.length : 'not an array');

    // Ensure podcastDataList is an array
    const dataArray = Array.isArray(podcastDataList) ? podcastDataList : [];

    // Parse and sort by timestamp (newest first)
    const podcasts: PodcastMetadata[] = dataArray
      .map((data: unknown) => {
        try {
          console.log(`Parsing data:`, typeof data, data);
          // Handle both string and already parsed object
          if (typeof data === 'string') {
            return JSON.parse(data);
          } else if (typeof data === 'object' && data !== null) {
            // Data is already an object, return as-is
            return data;
          } else {
            console.error('Unexpected data type:', typeof data, data);
            return null;
          }
        } catch (parseError) {
          console.error('Error parsing podcast data:', parseError, 'Data:', data);
          return null;
        }
      })
      .filter((podcast): podcast is PodcastMetadata => podcast !== null)
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`Retrieved ${podcasts.length} podcasts for FID ${fid}`);

    return NextResponse.json({
      success: true,
      fid,
      podcasts,
      count: podcasts.length,
      debug: {
        keyExists,
        listLength,
        rawDataLength: Array.isArray(podcastDataList) ? podcastDataList.length : 'not an array',
        rawDataType: typeof podcastDataList
      }
    });

  } catch (error) {
    console.error('Error retrieving podcasts:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve podcasts' },
      { status: 500 }
    );
  }
}
