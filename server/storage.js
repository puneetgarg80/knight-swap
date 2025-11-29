const fs = require('fs');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

class StorageService {
    constructor() {
        this.driver = process.env.STORAGE_DRIVER === 'gcs' ? new GCSDriver() : new LocalDriver();
        console.log(`StorageService initialized with driver: ${this.driver.constructor.name}`);
    }

    async saveLog(filename, data, userName) {
        return this.driver.saveLog(filename, data, userName);
    }

    async saveCertificate(filename, buffer, userName) {
        return this.driver.saveCertificate(filename, buffer, userName);
    }

    getCertificateUrl(filename, userName) {
        return this.driver.getCertificateUrl(filename, userName);
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

    async saveLog(filename, data, userName) {
        const userLogsDir = userName ? path.join(this.logsDir, 'users', userName) : this.logsDir;
        this._ensureDir(userLogsDir);
        const filePath = path.join(userLogsDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return filePath;
    }

    async saveCertificate(filename, buffer, userName) {
        const userCertDir = userName ? path.join(this.certDir, 'users', userName) : this.certDir;
        this._ensureDir(userCertDir);
        const filePath = path.join(userCertDir, filename);
        fs.writeFileSync(filePath, buffer);
        return filePath;
    }

    getCertificateUrl(filename, userName) {
        if (userName) {
            return `/certificates/users/${userName}/${filename}`;
        }
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

    async saveLog(filename, data, userName) {
        const path = userName ? `users/${userName}/logs/${filename}` : `logs/${filename}`;
        const file = this.bucket.file(path);
        await file.save(JSON.stringify(data, null, 2), {
            contentType: 'application/json',
            resumable: false
        });
        return `gs://${this.bucketName}/${path}`;
    }

    async saveCertificate(filename, buffer, userName) {
        const path = userName ? `users/${userName}/certificates/${filename}` : `certificates/${filename}`;
        const file = this.bucket.file(path);
        await file.save(buffer, {
            contentType: 'image/png',
            resumable: false
        });
        try {
            await file.makePublic();
        } catch (err) {
            console.warn(`Failed to make certificate public: ${err.message}. Ensure bucket IAM allows public access if needed.`);
        }
        return `gs://${this.bucketName}/${path}`;
    }

    getCertificateUrl(filename, userName) {
        const path = userName ? `users/${userName}/certificates/${filename}` : `certificates/${filename}`;
        return `https://storage.googleapis.com/${this.bucketName}/${path}`;
    }
}

module.exports = new StorageService();
