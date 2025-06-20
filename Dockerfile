FROM node:24-alpine
COPY index.ts package.json package-lock.json ./
RUN npm install
ENTRYPOINT ["node", "--no-warnings", "index.ts", "/rename"]
