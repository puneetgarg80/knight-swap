const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

class StorageService {
    constructor() {
        this.driver = process.env.STORAGE_DRIVER === 'gcs' ? new GCSDriver() : new LocalDriver();
        console.log(`StorageService initialized with driver: ${this.driver.constructor.name}`);
    }

    async saveLog(filename, data) {
        return this.driver.saveLog(filename, data);
    }

    async saveCertificate(filename, buffer) {
        return this.driver.saveCertificate(filename, buffer);
    }

    getCertificateUrl(filename) {
        return this.driver.getCertificateUrl(filename);
    }
}

class LocalDriver {
    constructor() {
        this.logsDir = process.env.LOGS_DIR || path.join(__dirname, 'logs');
        this.certDir = path.join(__dirname, 'public', 'certificates');

        this._ensureDir(this.logsDir);
        this._ensureDir(this.certDir);
    }

    _ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (err) {
                console.error(`Failed to create directory ${dir}:`, err);
            }
        }
    }

    async saveLog(filename, data) {
        const filePath = path.join(this.logsDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return filePath;
    }

    async saveCertificate(filename, buffer) {
        const filePath = path.join(this.certDir, filename);
        fs.writeFileSync(filePath, buffer);
        return filePath;
    }

    getCertificateUrl(filename) {
        return `/certificates/${filename}`;
    }
}

class GCSDriver {
    constructor() {
        this.bucketName = process.env.GCS_BUCKET_NAME;
        if (!this.bucketName) {
            throw new Error("GCS_BUCKET_NAME environment variable is required for GCS driver");
        }
        this.storage = new Storage();
        this.bucket = this.storage.bucket(this.bucketName);
    }

    async saveLog(filename, data) {
        const file = this.bucket.file(`logs/${filename}`);
        await file.save(JSON.stringify(data, null, 2), {
            contentType: 'application/json',
            resumable: false
        });
        return `gs://${this.bucketName}/logs/${filename}`;
    }

    async saveCertificate(filename, buffer) {
        const file = this.bucket.file(`certificates/${filename}`);
        await file.save(buffer, {
            contentType: 'image/png',
            resumable: false
        });
        try {
            await file.makePublic();
        } catch (err) {
            console.warn(`Failed to make certificate public: ${err.message}. Ensure bucket IAM allows public access if needed.`);
        }
        return `gs://${this.bucketName}/certificates/${filename}`;
    }

    getCertificateUrl(filename) {
        return `https://storage.googleapis.com/${this.bucketName}/certificates/${filename}`;
    }
}

module.exports = new StorageService();
