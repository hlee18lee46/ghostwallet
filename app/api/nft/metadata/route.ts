
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

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const { name, description, image, attributes } = body

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof image !== 'string' ||
      !image.startsWith('https://') ||
      !Array.isArray(attributes)
    ) {
      return NextResponse.json(
        { error: 'Invalid NFT metadata fields' },
        { status: 400 },
      )
    }

    const nftMetadata = {
      name: name.trim(),
      symbol: 'GHOST',
      description:
        typeof description === 'string'
          ? description
          : 'GhostWallet personality NFT',
      image,
      attributes: attributes.map(
        (attribute: { trait_type?: unknown; value?: unknown }) => ({
          trait_type: String(attribute.trait_type ?? ''),
          value: String(attribute.value ?? ''),
        }),
      ),
      properties: {
        category: 'image',
      },
    }

    const response = await fetch(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataContent: nftMetadata,
          pinataMetadata: {
            name: `GhostWallet-${Date.now()}`,
          },
        }),
        cache: 'no-store',
      },
    )

    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.IpfsHash) {
      console.error('Pinata metadata error:', result)

      return NextResponse.json(
        {
          error:
            typeof result?.error === 'string'
              ? result.error
              : 'Pinata metadata upload failed',
        },
        { status: 502 },
      )
    }

    const cid = result.IpfsHash

    return NextResponse.json({
      success: true,
      cid,
      metadataUri: `https://gateway.pinata.cloud/ipfs/${cid}`,
      ipfsUri: `ipfs://${cid}`,
    })
  } catch (error) {
    console.error('NFT metadata error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to upload NFT metadata',
      },
      { status: 500 },
    )
  }
}
