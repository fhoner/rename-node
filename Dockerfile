FROM node:24-alpine
COPY index.ts renamer.ts model.ts package.json package-lock.json tsconfig.json ./
RUN npm install && npm run build
ENV PHOTOS_DIRECTORY=/photos
ENTRYPOINT node --no-warnings dist/index.js --directory "$PHOTOS_DIRECTORY"
