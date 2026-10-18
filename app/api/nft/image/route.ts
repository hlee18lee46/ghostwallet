
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const token = process.env.PINATA_JWT

    if (!token) {
      return NextResponse.json(
        { error: 'PINATA_JWT is not configured' },
        { status: 503 },
      )
    }

    const body = await request.json()
    const imagePath = body.imagePath

    if (
      typeof imagePath !== 'string' ||
      !imagePath.startsWith('/') ||
      imagePath.startsWith('//') ||
      !imagePath.startsWith('/api/')
    ) {
      return NextResponse.json(
        { error: 'Invalid image path' },
        { status: 400 },
      )
    }

    // Fetch only from the app's own local image endpoint.
    // Avoid accepting arbitrary external URLs.
    const imageUrl = new URL(imagePath, request.url)

    const imageResponse = await fetch(imageUrl, {
      cache: 'no-store',
    })

    if (!imageResponse.ok) {
      throw new Error('Could not generate ghost image')
    }

    const contentType =
      imageResponse.headers.get('content-type') ?? ''

    if (!contentType.startsWith('image/')) {
      throw new Error('Generated resource is not an image')
    }

    const imageBytes = await imageResponse.arrayBuffer()

    if (imageBytes.byteLength > 5 * 1024 * 1024) {
      throw new Error('Ghost image exceeds 5 MB')
    }

    const form = new FormData()

    form.append(
      'file',
      new Blob([imageBytes], { type: contentType }),
      'ghost.png',
    )

    form.append(
      'pinataMetadata',
      JSON.stringify({ name: `GhostWallet-${Date.now()}` }),
    )

    const pinataResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      },
    )

    const result = await pinataResponse.json()

    if (!pinataResponse.ok || !result.IpfsHash) {
      throw new Error('Pinata image upload failed')
    }

    return NextResponse.json({
      success: true,
      imageUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      cid: result.IpfsHash,
    })
  } catch (error) {
    console.error('NFT image upload error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Image upload failed',
      },
      { status: 500 },
    )
  }
}
