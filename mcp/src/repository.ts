import { Anomaly, MarketSummary } from './schema';

/**
 * PolymarketRepository
 * Handles Durable Object SQL storage for Polymarket market snapshots & anomalies.
 */
export class PolymarketRepository {
	private ctx: DurableObjectState;

	constructor(ctx: DurableObjectState) {
		this.ctx = ctx;
	}

	/**
	 * Initialize database schema for Polymarket data
	 */
	public initializeDatabase(): void {
		try {
			this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS market_snapshots (
          id TEXT PRIMARY KEY,
          title TEXT,
          yes_price REAL,
          volume_num REAL,
          timestamp TEXT
        );

        CREATE TABLE IF NOT EXISTS anomalies (
          id TEXT,
          title TEXT,
          change_pct REAL,
          vol_ratio REAL,
          note TEXT,
          detected_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON anomalies(detected_at);
      `);
			console.log('✅ Polymarket database initialized');
		} catch (error) {
			console.error('❌ Error initializing database:', error);
			throw error;
		}
	}

	/**
	 * Save (insert or replace) recent market snapshots
	 */
	public async saveMarketSnapshot(markets: MarketSummary[]): Promise<void> {
		try {
			for (const m of markets) {
				await this.ctx.storage.sql.exec(
					`
          INSERT OR REPLACE INTO market_snapshots 
          (id, title, yes_price, volume_num, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `,
					m.id,
					m.title,
					m.yesPrice,
					m.volumeNum,
					m.timestamp
				);
			}
		} catch (error) {
			console.error('❌ Error saving market snapshot:', error);
			throw new Error(`Failed to save snapshot: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Get the most recent market snapshots
	 */
	public async getRecentMarkets(limit = 5): Promise<MarketSummary[]> {
		try {
			const results = await this.ctx.storage.sql.exec(`SELECT * FROM market_snapshots ORDER BY timestamp DESC LIMIT ?`, limit);

			const markets: MarketSummary[] = [];
			for (const row of results) {
				markets.push({
					id: row.id,
					title: row.title,
					yesPrice: row.yes_price,
					volumeNum: row.volume_num,
					timestamp: row.timestamp,
				});
			}

			return markets;
		} catch (error) {
			console.error('❌ Error fetching markets:', error);
			throw new Error(`Failed to fetch recent markets: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Save anomaly entries (appends to the anomalies table)
	 */
	public async saveAnomalies(anomalies: Anomaly[]): Promise<void> {
		try {
			for (const a of anomalies) {
				await this.ctx.storage.sql.exec(
					`
          INSERT INTO anomalies 
          (id, title, change_pct, vol_ratio, note, detected_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
					a.id,
					a.title,
					a.changePct,
					a.volRatio,
					a.note,
					a.detectedAt
				);
			}
		} catch (error) {
			console.error('❌ Error saving anomalies:', error);
			throw new Error(`Failed to save anomalies: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Get recent anomalies
	 */
	public async getRecentAnomalies(limit = 10): Promise<Anomaly[]> {
		try {
			const results = await this.ctx.storage.sql.exec(`SELECT * FROM anomalies ORDER BY detected_at DESC LIMIT ?`, limit);

			const anomalies: Anomaly[] = [];
			for (const row of results) {
				anomalies.push({
					id: row.id,
					title: row.title,
					changePct: row.change_pct,
					volRatio: row.vol_ratio,
					note: row.note,
					detectedAt: row.detected_at,
				});
			}

			return anomalies;
		} catch (error) {
			console.error('❌ Error fetching anomalies:', error);
			throw new Error(`Failed to fetch anomalies: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Simple statistics resource helper (optional)
	 * Example: total markets tracked and anomaly count
	 */
	public async getStats(): Promise<{ markets: number; anomalies: number }> {
		try {
			const totalMarkets = await this.ctx.storage.sql.exec(`SELECT COUNT(*) AS count FROM market_snapshots`);
			const totalAnomalies = await this.ctx.storage.sql.exec(`SELECT COUNT(*) AS count FROM anomalies`);

			let markets = 0;
			let anomalies = 0;

			for (const row of totalMarkets) markets = Number(row.count) || 0;
			for (const row of totalAnomalies) anomalies = Number(row.count) || 0;

			return { markets, anomalies };
		} catch (error) {
			console.error('❌ Error fetching stats:', error);
			throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}
