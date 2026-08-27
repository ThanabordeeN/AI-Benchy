import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let baseUrl = body.baseUrl || 'http://localhost:8000/v1';
    const apiKey = body.apiKey || 'EMPTY';

    // Normalize URL
    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

    const startTime = Date.now();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey && apiKey !== 'EMPTY') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(modelsUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            reachable: false,
            latencyMs,
            status: response.status,
            error: `Endpoint responded with status ${response.status} ${response.statusText}`,
          },
          { status: 200 }
        );
      }

      const data = await response.json();
      const modelsList: Array<{ id: string; object?: string; owned_by?: string }> =
        Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

      const modelNames = modelsList.map(m => (typeof m === 'string' ? m : m.id || 'unknown'));

      return NextResponse.json({
        success: true,
        reachable: true,
        latencyMs,
        modelsCount: modelNames.length,
        models: modelNames,
        raw: data,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;
      return NextResponse.json(
        {
          success: false,
          reachable: false,
          latencyMs,
          error: fetchErr.name === 'AbortError' ? 'Connection timed out (6s)' : (fetchErr.message || 'Failed to connect to endpoint'),
        },
        { status: 200 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
