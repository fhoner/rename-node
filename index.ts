import { createLogger, format, transports } from "winston";
// @ts-ignore
import fs from "fs";
// @ts-ignore
import got from "got";
import path from "path";
import { fileTypeFromFile } from "file-type";
import ExifReader from "exifreader";
import commandLineArgs from "command-line-args";
import { DateTime } from "luxon";
import { GeoapifyReponse, RenameData } from "./model.js";
const { renameFile } = await import("./renamer.js");

const optionDefinitions = [
  { name: "directory", alias: "d", type: String },
  { name: "datetimeFormat", type: String, defaultValue: "yyyy-MM-dd HH-mm-ss" },
  {
    name: "format",
    type: String,
    defaultValue:
      "%datetime% - My fantastic tour - %name%, %street% %housenumber%, %city%",
  },
  { name: "apikey", type: String },
];
const options = commandLineArgs(optionDefinitions);

const { combine, timestamp, printf } = format;

const getUrl = (gpsTags: ExifReader.GpsTags) =>
  `https://api.geoapify.com/v1/geocode/reverse?lat=${gpsTags.Latitude}&lon=${gpsTags.Longitude}&format=json&apiKey=${options.apikey}&lang=de`;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  format: combine(timestamp(), myFormat, format.colorize({ all: true })),
  transports: [new transports.Console()],
});

const inputDirectory: string = options.directory;

if (!inputDirectory?.length) {
  logger.error("No input directory specified");
  process.exit(0);
} else if (!fs.existsSync(inputDirectory)) {
  logger.error(`Input directory '${inputDirectory}' does not exist`);
  process.exit(0);
}

logger.info("Scanning input directory for photos");
const filesWithMime = await Promise.all(
  fs
    .readdirSync(inputDirectory)
    .filter((file) => {
      const fullPath = path.join(inputDirectory, file);
      return fs.statSync(fullPath).isFile();
    })
    .map((filename) => ({
      filename,
      fullPath: path.join(inputDirectory, filename),
    }))
    .map(async ({ filename, fullPath }) => ({
      filename,
      fullPath,
      filetype: await fileTypeFromFile(fullPath),
    })),
);
const filesToRename = filesWithMime.filter(
  ({ filetype }) => (filetype?.mime?.indexOf("image") ?? -1) > -1,
);
const skippedFiles = filesWithMime.length - filesToRename.length;
logger.info(`Found ${filesToRename.length} photos to rename`);
if (skippedFiles > 0) {
  logger.warn(`Skipped ${skippedFiles} photos as they are not of type image`);
}
let counter = 1;

for (const { filename, fullPath } of filesToRename) {
  logger.info(`${counter++}/${filesToRename.length} ${filename}`);
  const fileBytes = fs.readFileSync(fullPath);
  const extension = filename.split(".").reduce((a, b) => b);
  const tags = ExifReader.load(fileBytes, { expanded: true });
  if (!tags?.gps) {
    logger.info(`No GPS tags found`);
  } else {
    logger.info("Found GPS tags; calling Goeapify");
    logger.info(`GET ${getUrl(tags.gps)}`);
  }
  const timestampGps = (
    tags.exif?.DateTimeOriginal ??
    tags.exif?.DateTimeDigitized ??
    tags.exif?.DateTime
  )?.description;
  if (!timestampGps) {
    logger.warn(`Could not detect any datetime; skip rename`);
    continue;
  }
  const timestamp = DateTime.fromFormat(timestampGps, "yyyy:MM:dd HH:mm:ss");
  const renameData: RenameData = !tags?.gps
    ? {}
    : (await got.get<GeoapifyReponse>(getUrl(tags.gps)).json()).results[0];
  const newFileName = renameFile(`${options.format}.${extension}`, {
    timestamp: timestamp.toFormat(options.datetimeFormat),
    geo: renameData,
  });
  const fullNewFileName = path.join(inputDirectory, newFileName);
  logger.info(`Rename from '${fullPath}' to '${fullNewFileName}'`);
  try {
    fs.renameSync(fullPath, fullNewFileName);
  } catch (error) {
    logger.error(`Could not rename ${fullPath}`, error);
  }
}
