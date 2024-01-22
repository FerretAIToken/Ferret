import sqlite3 from 'sqlite3';

class RateLimiter {
    private db: sqlite3.Database;

    constructor(dbPath: string) {
        this.db = new sqlite3.Database(dbPath);
        this.setupDatabase();
    }

    private setupDatabase() {
        this.db.run(`
      CREATE TABLE IF NOT EXISTS RateLimit (
        userId TEXT PRIMARY KEY,
        nextAllowedRequest INTEGER NOT NULL
      )
    `);
    }

    async acquire(userId: string, maxRequests: number, interval: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const currentTime = Date.now();

            this.db.run(
                `
        INSERT OR REPLACE INTO RateLimit (userId, nextAllowedRequest)
        VALUES (?, COALESCE(
          (SELECT nextAllowedRequest FROM RateLimit WHERE userId = ?),
          ?
        ))
        `,
                [userId, userId, currentTime],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db.get(
                            'SELECT nextAllowedRequest FROM RateLimit WHERE userId = ?',
                            [userId],
                            (err, row) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    // @ts-ignore
                                    const nextAllowedRequest = row?.nextAllowedRequest || 0;
                                    const timeDifference = currentTime - nextAllowedRequest;
                                    const allowedRequests = Math.floor(timeDifference / interval);

                                    if (allowedRequests >= maxRequests) {
                                        resolve(false); // Rate limit reached
                                    } else {
                                        const remainingTime = timeDifference % interval;
                                        const newNextAllowedRequest = currentTime + (maxRequests - allowedRequests) * interval - remainingTime;

                                        this.db.run(
                                            'UPDATE RateLimit SET nextAllowedRequest = ? WHERE userId = ?',
                                            [newNextAllowedRequest, userId],
                                            (err) => {
                                                if (err) {
                                                    reject(err);
                                                } else {
                                                    resolve(true);
                                                }
                                            }
                                        );
                                    }
                                }
                            }
                        );
                    }
                }
            );
        });
    }

    async getWaitTime(userId: string): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const currentTime = Date.now();

            this.db.get(
                'SELECT nextAllowedRequest FROM RateLimit WHERE userId = ?',
                [userId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        // @ts-ignore
                        const nextAllowedRequest = row?.nextAllowedRequest || 0;
                        const waitTime = Math.max(0, Math.ceil((nextAllowedRequest - currentTime) / 1000));
                        resolve(waitTime);
                    }
                }
            );
        });
    }

    close(): void {
        this.db.close();
    }
}

export default RateLimiter;
