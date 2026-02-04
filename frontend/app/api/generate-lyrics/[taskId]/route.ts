import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        let { taskId } = await params;

        // Fallback: extract from URL if params is empty (sometimes happens in edge cases)
        if (!taskId) {
            const urlParts = request.nextUrl.pathname.split('/');
            taskId = urlParts[urlParts.length - 1]; // Last part is taskId
        }

        if (!taskId) {
            return NextResponse.json(
                { error: 'Task ID is required' },
                { status: 400 }
            );
        }

        // API Key from environment (NEVER exposed to client)
        const apiKey = process.env.SUNO_API_KEY;
        if (!apiKey) {
            console.error('SUNO_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Poll Suno API for task status using LYRICS record-info endpoint
        // Endpoint: https://api.sunoapi.org/api/v1/lyrics/record-info?taskId=...
        const response = await fetch(
            `https://api.sunoapi.org/api/v1/lyrics/record-info?taskId=${taskId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Suno API (Lyrics Status) error:', response.status, errorData);
            return NextResponse.json(
                { error: 'Failed to fetch lyrics status', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Check response code
        if (data.code !== 200) {
            return NextResponse.json(
                { error: data.msg || 'Failed to get status' },
                { status: 500 }
            );
        }

        // Extract status and lyrics from response
        //  Response format for /api/v1/lyrics/record-info: 
        // {
        //   "code": 200,
        //   "data": {
        //     "status": "SUCCESS" | "PROCESSING" | "FAIL",
        //     "response": {
        //       "data": [
        //         {
        //           "text": "[Verse]...", // The generated lyrics!
        //           "title": "Title",
        //           "status": "complete"
        //         }
        //       ]
        //     }
        //   }
        // }

        const resultData = data.data || {};
        const providerStatus = resultData.status; // "SUCCESS", "PROCESSING", "FAIL"
        const responseObj = resultData.response || {};
        // Note: Documentation says "data" array inside response, but sometimes "sunoData".
        // We check both for robustness.
        const tracksData = responseObj.data || responseObj.sunoData || [];

        let status = 'pending';
        let lyrics = null;
        let lyricsOptions: string[] = [];

        if (providerStatus === 'SUCCESS' && tracksData.length > 0) {
            // Extract lyrics from ALL tracks
            lyricsOptions = tracksData.map((track: any) => track.text || track.prompt || track.lyrics || '').filter((l: string) => l.length > 0);

            // Set primary lyrics to the first option by default
            if (lyricsOptions.length > 0) {
                lyrics = lyricsOptions[0];
                status = 'complete';
            } else {
                status = 'processing';
            }
        } else if (providerStatus === 'PROCESSING' || providerStatus === 'PENDING') {
            status = 'processing';
        } else if (providerStatus === 'FAIL' || providerStatus === 'FAILED' || providerStatus === 'ERROR') {
            status = 'failed';
        }

        return NextResponse.json({
            success: true,
            status,
            lyrics, // Primary/default
            lyricsOptions, // All options
            rawData: data.data, // For debugging
        });

    } catch (error: any) {
        console.error('Get lyrics status error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
