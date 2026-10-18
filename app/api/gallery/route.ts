
import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { DEMO_GALLERY } from "@/lib/demo/community";

export const runtime = "nodejs";

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 5,
    })
  : null;

const connection = new Connection(RPC_URL, "confirmed");

const CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6t3Cqx6dF4QXxjYBpyUL3XhJbqzXjV6M1G"
);

// Use the official Metaplex Core program address
// supplied by the installed mpl-core package in production.

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

async function ensureTable() {
  if (!pool) {
    throw new Error(
      "DATABASE_URL is required for Snowflake Postgres"
    );
  }

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

  await pool.query(`
    ALTER TABLE nft_gallery
    ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE
  `);
}

function normalizeRow(row: Record<string, unknown>) {
  return {
    id: row.mint_address,
    mintAddress: row.mint_address,
    ownerWallet: row.owner_wallet,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    metadataUri: row.metadata_uri,
    personality: row.pet_type,
    mood: row.mood,
    degenScore: Number(row.energy ?? 0),
    transactionSignature: row.transaction_signature,
    network: row.network,
    isShared: row.is_shared,
    mintedAt: row.created_at,
    laughs: 0,
    isDemo: false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);

    const sort =
      url.searchParams.get("sort") === "recent"
        ? "recent"
        : "trending";

    const wallet = url.searchParams.get("wallet");

    if (!pool) {
      return NextResponse.json({
        items: [...DEMO_GALLERY].sort((a, b) =>
          sort === "recent"
            ? b.mintedAt.localeCompare(a.mintedAt)
            : b.laughs - a.laughs
        ),
        isDemo: true,
      });
    }

    await ensureTable();

    const values: string[] = ["GHOST", "devnet"];

    let where = `
      symbol = $1
      AND network = $2
    `;

    if (wallet) {
      try {
        new PublicKey(wallet);
      } catch {
        return jsonError("Invalid wallet address", 400);
      }

      values.push(wallet);
      where += ` AND owner_wallet = $3`;
    } else {
      where += ` AND is_shared = TRUE`;
    }

    const result = await pool.query(
      `
      SELECT *
      FROM nft_gallery
      WHERE ${where}
      ORDER BY created_at DESC
      LIMIT 100
      `,
      values
    );

    const items = result.rows.map(normalizeRow);

    return NextResponse.json({
      items,
      isDemo: false,
    });
  } catch (error) {
    console.error("Gallery GET error:", error);

    return jsonError("Failed to load NFT gallery", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!pool) {
      return jsonError(
        "Database unavailable: DATABASE_URL is not configured",
        503
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return jsonError("Invalid JSON body", 400);
    }

    const {
      mintAddress,
      ownerWallet,
      transactionSignature,
      name,
      description,
      imageUrl,
      metadataUri,
      personality,
      mood,
      degenScore,
      isShared,
    } = body;

    const missingFields = [
      "mintAddress",
      "ownerWallet",
      "transactionSignature",
    ].filter(
      (field) =>
        typeof body[field] !== "string" ||
        !body[field].trim()
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required NFT fields: ${missingFields.join(", ")}`,
          missingFields,
          receivedFields: Object.keys(body),
        },
        { status: 400 }
      );
    }

    let asset: PublicKey;
    let owner: PublicKey;

    try {
      asset = new PublicKey(mintAddress);
      owner = new PublicKey(ownerWallet);
    } catch {
      return jsonError("Invalid Solana address", 400);
    }

    // Verify that the submitted signature belongs to
    // a confirmed, successful transaction.
    const tx = await connection.getParsedTransaction(
      transactionSignature,
      {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }
    );

    if (!tx || tx.meta?.err) {
      return jsonError(
        "Mint transaction not found or not confirmed",
        400
      );
    }

    const accountKeys = tx.transaction.message.accountKeys;

    const signedByOwner = accountKeys.some(
      (account) =>
        account.pubkey.equals(owner) && account.signer
    );

    if (!signedByOwner) {
      return jsonError(
        "Owner did not sign the mint transaction",
        403
      );
    }

    // Verify the asset account exists and is owned by
    // the Metaplex Core program.
    const assetInfo =
      await connection.getAccountInfo(asset, "confirmed");

    if (!assetInfo) {
      return jsonError("NFT asset does not exist", 400);
    }

    // Note: Program ownership alone does not prove that
    // this transaction minted the asset or that the
    // claimed wallet currently owns it.
    // A Metaplex Core asset decoder is needed for that
    // additional verification before production use.

    await ensureTable();

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
        pulse_rate,
        breathing_rate,
        transaction_signature,
        network,
        is_shared,
        updated_at
      )
      VALUES (
        $1, $2, $3, 'GHOST',
        $4, $5, $6,
        $7, $8, $9,
        NULL, NULL,
        $10, 'devnet',
        $11, NOW()
      )
      ON CONFLICT (mint_address)
      DO NOTHING
      RETURNING *
      `,
      [
        asset.toBase58(),
        owner.toBase58(),
        name ?? "GhostWallet Ghost",
        description ?? "",
        imageUrl ?? "",
        metadataUri ?? "",
        personality ?? "",
        mood ?? "",
        String(degenScore ?? 0),
        transactionSignature,
        isShared === true,
      ]
    );

    if (result.rowCount === 0) {
      return jsonError(
        "NFT already exists in the gallery",
        409
      );
    }

    return NextResponse.json({
      success: true,
      item: normalizeRow(result.rows[0]),
    });
  } catch (error) {
    console.error("Gallery POST error:", error);

    return jsonError("Failed to save NFT", 500);
  }
}
