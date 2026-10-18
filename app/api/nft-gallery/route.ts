import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// ---------------------------------------------------------
// Snowflake Postgres connection
// ---------------------------------------------------------

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
})

// ---------------------------------------------------------
// Ensure NFT table exists
// ---------------------------------------------------------

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nft_gallery (
      mint_address TEXT PRIMARY KEY,
      owner_wallet TEXT NOT NULL,

      name TEXT,
      symbol TEXT,
      description TEXT,

      image_url TEXT,
      metadata_uri TEXT,

      pet_type TEXT,
      mood TEXT,
      energy TEXT,

      pulse_rate DOUBLE PRECISION,
      breathing_rate DOUBLE PRECISION,

      transaction_signature TEXT,
      network TEXT DEFAULT 'devnet',

      is_shared BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Handles tables created before is_shared was added
  await pool.query(`
    ALTER TABLE nft_gallery
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE
  `);
}

// ---------------------------------------------------------
// GET
// Returns all NFTs
//
// GET /api/nft-gallery
// GET /api/nft-gallery?wallet=ABC123
// ---------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    let result;

    if (wallet) {
      result = await pool.query(
        `
        SELECT *
        FROM nft_gallery
        WHERE owner_wallet = $1
        ORDER BY created_at DESC
        `,
        [wallet]
      );
    } else {
      result = await pool.query(`
        SELECT *
        FROM nft_gallery
        ORDER BY created_at DESC
      `);
    }

    return NextResponse.json({
      success: true,
      count: result.rowCount ?? result.rows.length,
      nfts: result.rows,
    });
  } catch (error) {
    console.error("GET /api/nft-gallery error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown database error",
      },
      {
        status: 500,
      }
    );
  }
}

// ---------------------------------------------------------
// POST
// Creates or updates an NFT
// ---------------------------------------------------------


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      )
    }

    const {
      mintAddress,
      ownerWallet,
      name,
      description,
      imageUrl,
      metadataUri,
      personality,
      mood,
      degenScore,
      transactionSignature,
    } = body

    if (
      typeof mintAddress !== 'string' ||
      !mintAddress.trim() ||
      typeof ownerWallet !== 'string' ||
      !ownerWallet.trim() ||
      typeof transactionSignature !== 'string' ||
      !transactionSignature.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'mintAddress, ownerWallet and transactionSignature are required',
        },
        { status: 400 },
      )
    }

    await ensureTable()

    const result = await pool.query(
      `
      INSERT INTO nft_gallery (
        mint_address,
        owner_wallet,
        name,
        symbol,
        description,
        image_url,
        metadata_uri,
        pet_type,
        mood,
        energy,
        transaction_signature,
        network,
        is_shared
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13
      )
      ON CONFLICT (mint_address)
      DO UPDATE SET
        owner_wallet = EXCLUDED.owner_wallet,
        name = EXCLUDED.name,
        symbol = EXCLUDED.symbol,
        description = EXCLUDED.description,
        image_url = EXCLUDED.image_url,
        metadata_uri = EXCLUDED.metadata_uri,
        pet_type = EXCLUDED.pet_type,
        mood = EXCLUDED.mood,
        energy = EXCLUDED.energy,
        transaction_signature = EXCLUDED.transaction_signature,
        network = EXCLUDED.network,
        is_shared = EXCLUDED.is_shared,
        updated_at = NOW()
      RETURNING *
      `,
      [
        mintAddress,
        ownerWallet,
        name ?? null,
        'GHOST',
        description ?? null,
        imageUrl ?? null,
        metadataUri ?? null,
        personality ?? null,
        mood ?? null,
        degenScore != null ? String(degenScore) : null,
        transactionSignature,
        'devnet',
        true,
      ],
    )

    return NextResponse.json({
      success: true,
      message: 'Ghost NFT saved to Snowflake Postgres',
      nft: result.rows[0],
    })
  } catch (error) {
    console.error('POST /api/nft-gallery error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Database error',
      },
      { status: 500 },
    )
  }
}
