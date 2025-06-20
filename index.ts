import { createLogger, format, transports } from 'winston';
// @ts-ignore
import fs from 'fs';
import { fileTypeFromFile } from 'file-type';
import ExifReader from 'exifreader';
import got from 'got';

interface RenameData {
    name?: string, // Stadtkirche St.Germanus
    country_code?: string, // de
    city?: string, // Stuttgart
    suburb?: string, // Untertürkheim
    street?: string, // Trettachstraße
    housenumber?: string, // 3
}

interface GeoapifyReponse {
    results: RenameData[],
}

const { combine, timestamp, printf } = format;

const getUrl = (gpsTags: ExifReader.GpsTags) =>
    `https://api.geoapify.com/v1/geocode/reverse?lat=${gpsTags.Latitude}&lon=${gpsTags.Longitude}&format=json&apiKey=f87244caa7dc40c4b5a9f327473abec2`;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        myFormat,
        format.colorize({ all: true }),
    ),
    transports: [new transports.Console()]
});

const inputDirectory: string = process.argv.slice(2)[0];

if (!inputDirectory?.length) {
    logger.error('No input directory specified');
    process.exit(0);
} else if (!fs.existsSync(inputDirectory)) {
    logger.error(`Input directory '${inputDirectory}' does not exist`);
    process.exit(0);
}

logger.info('Scanning input directory for photos');
const filesWithMime = await Promise.all(
    fs.readdirSync(inputDirectory)
        .map((filename) => ({ filename, fullPath: `${inputDirectory}/${filename}`, }))
        .map(async ({ filename, fullPath }) => ({ filename, fullPath, filetype: await fileTypeFromFile(fullPath) }))
);
const filesToRename = filesWithMime.filter(({ filetype }) => (filetype?.mime?.indexOf('image') ?? -1) > -1);
const skippedFiles = filesWithMime.length - filesToRename.length;
logger.info(`Found ${filesToRename.length} photos to rename`);
if (skippedFiles > 0) {
    logger.warn(`Skipped ${skippedFiles} photos as they are not of type image`);
}
let counter = 1;

for (const { filename, fullPath } of filesToRename) {
    logger.info(`${counter++}/${filesToRename.length} ${filename}`);
    const fileBytes = fs.readFileSync(fullPath);
    const tags = ExifReader.load(fileBytes, { expanded: true });
    if (!tags?.gps) {
        logger.info(`No GPS tags found`);
    } else {
        logger.info('Found GPS tags; calling Goeapify');
        logger.info(`GET ${getUrl(tags.gps)}`);
    }
    const timestamp = (tags.exif?.DateTimeOriginal ?? tags.exif?.DateTimeDigitized ?? tags.exif?.DateTime)?.description;
    if (!timestamp) {
        logger.warn(`Could not detect any datetime; skip rename`);
        continue;
    }
    const renameData: RenameData = !tags?.gps ? {} : (await got.get<GeoapifyReponse>(getUrl(tags.gps)).json()).results[0];
    const newFileName = `${timestamp} - ${renameData.name}`;
    logger.info(`Rename from ${filename} to ${newFileName}`);
}
